"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import {
  CreateProjectInput,
  UpdateProjectInput,
  ProjectFilter,
  ProjectWithCategory,
} from "../domain/index";
import { toSnakeCaseBody } from "@/shared/lib/go-api";
import { submitToIndexNow } from "@/shared/lib/indexnow";
import { submitToGoogleIndex } from "@/shared/lib/google-indexing";
import { purgeCloudflareCache } from "@/shared/lib/cloudflare-purge";

const GO_API_URL = process.env.GO_API_URL;

interface GoRefResponse {
  id: string;
  name: string;
  slug: string;
}

interface GoCategoryGroupRefResponse {
  id: string;
  name: string;
}

interface GoServiceGroupRefResponse {
  id: string;
  name: string;
  slug: string;
}

interface GoProjectCategoryResponse {
  id: string;
  name: string;
  slug: string;
  group_id: string | null;
  condition: "new" | "used";
  group: GoCategoryGroupRefResponse | null;
  low_price: number;
  high_price: number;
  offer_count: number;
}

interface GoProjectServiceResponse {
  id: string;
  title: string;
  slug: string;
  group: GoServiceGroupRefResponse | null;
}

interface GoProjectResponse {
  id: string;
  title: string;
  slug: string;
  description: unknown;
  images: string[];
  is_featured: boolean;
  is_published: boolean;
  meta_title: string | null;
  meta_description: string | null;
  order_index: number;
  category_id: string;
  project_type_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  project_type: GoRefResponse | null;
  categories: GoProjectCategoryResponse[] | null;
  services: GoProjectServiceResponse[] | null;
}

interface GoErrorResponse {
  code: string;
  message: string;
  fields?: Record<string, string[]>;
}

interface GoAdjacentProjectResponse {
  title: string;
  slug: string;
}

interface GoAdjacentProjectsResponse {
  prev: GoAdjacentProjectResponse | null;
  next: GoAdjacentProjectResponse | null;
}

interface GoCategoryRefResponse {
  id: string;
  name: string;
  slug: string;
}

// toGoCategoryConditions maps the TS `{ id, condition }[]` shape
// (CreateProjectInput.categories) to Go's `{ category_id, condition }[]`
// wire shape — `toSnakeCaseBody` only rewrites top-level keys, so this
// nested array needs its own explicit mapping (`id` would otherwise reach
// Go unmodified as `id` instead of `category_id`).
function toGoCategoryConditions(
  categories: { id: string; condition: "new" | "used" }[] | undefined,
): { category_id: string; condition: string }[] {
  return (categories ?? []).map((c) => ({ category_id: c.id, condition: c.condition }));
}

function mapGoProject(row: GoProjectResponse): ProjectWithCategory {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description as ProjectWithCategory["description"],
    images: row.images ?? [],
    isFeatured: row.is_featured,
    isPublished: row.is_published,
    metaTitle: row.meta_title,
    metaDescription: row.meta_description,
    orderIndex: row.order_index,
    categoryId: row.category_id,
    projectTypeId: row.project_type_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    category: null,
    projectType: row.project_type
      ? { id: row.project_type.id, name: row.project_type.name, slug: row.project_type.slug }
      : null,
    services: (row.services ?? []).map((s) => ({
      id: s.id,
      title: s.title,
      slug: s.slug,
      group: s.group ? { id: s.group.id, name: s.group.name, slug: s.group.slug } : null,
    })),
    categories: (row.categories ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      groupId: c.group_id,
      group: c.group ? { id: c.group.id, name: c.group.name } : null,
      condition: c.condition,
      lowPrice: c.low_price,
      highPrice: c.high_price,
      offerCount: c.offer_count,
    })),
  };
}

async function extractErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const body = (await res.json()) as GoErrorResponse;
    return body.message || fallback;
  } catch {
    return fallback;
  }
}

// isPrerenderError lets a real fetch failure propagate out of "use cache"
// render functions instead of being swallowed — see
// modules/category/presentation/actions.ts's identical helper for why.
function isPrerenderError(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return (
      error.name === "AbortError" ||
      msg.includes("aborted") ||
      msg.includes("abort") ||
      msg.includes("prerendering") ||
      msg.includes("prerender")
    );
  }
  return false;
}

function buildProjectFilterParams(filter?: ProjectFilter): URLSearchParams {
  const params = new URLSearchParams();
  if (!filter) return params;
  if (filter.categoryId) params.set("category_id", filter.categoryId);
  if (filter.projectTypeId) params.set("project_type_id", filter.projectTypeId);
  if (filter.categorySlug) params.set("category_slug", filter.categorySlug);
  if (filter.categorySlugs && filter.categorySlugs.length > 0) {
    params.set("category_slugs", filter.categorySlugs.join(","));
  }
  if (filter.serviceSlug) params.set("service_slug", filter.serviceSlug);
  if (filter.serviceSlugs && filter.serviceSlugs.length > 0) {
    params.set("service_slugs", filter.serviceSlugs.join(","));
  }
  if (filter.isPublished !== undefined) params.set("is_published", String(filter.isPublished));
  if (filter.isFeatured !== undefined) params.set("is_featured", String(filter.isFeatured));
  if (filter.search) params.set("search", filter.search);
  if (filter.limit !== undefined) params.set("limit", String(filter.limit));
  if (filter.offset !== undefined) params.set("offset", String(filter.offset));
  if (filter.includeDeleted) params.set("include_deleted", "true");
  if (filter.orderBy) params.set("order_by", filter.orderBy);
  if (filter.orderDirection) params.set("order_direction", filter.orderDirection);
  return params;
}

export async function getProjectsAction(options?: ProjectFilter) {
  if (!GO_API_URL) {
    return { data: [] as ProjectWithCategory[], error: null };
  }
  try {
    const params = buildProjectFilterParams(options);
    const res = await fetch(`${GO_API_URL}/projects?${params.toString()}`, { cache: "no-store" });
    if (!res.ok) {
      return { data: [] as ProjectWithCategory[], error: await extractErrorMessage(res, "Failed to fetch projects") };
    }
    const rows = (await res.json()) as GoProjectResponse[] | null;
    return { data: (rows ?? []).map(mapGoProject), error: null };
  } catch (error) {
    if (isPrerenderError(error)) throw error;
    console.error("getProjectsAction error:", error);
    return { data: [] as ProjectWithCategory[], error: "Failed to fetch projects" };
  }
}

export async function countProjectsAction(
  options?: Pick<ProjectFilter, "categoryId" | "projectTypeId" | "categorySlug" | "categorySlugs" | "serviceSlug" | "serviceSlugs" | "isPublished" | "isFeatured" | "search" | "includeDeleted">,
) {
  if (!GO_API_URL) {
    return { data: 0, error: null };
  }
  try {
    const params = buildProjectFilterParams(options);
    const res = await fetch(`${GO_API_URL}/projects/count?${params.toString()}`, { cache: "no-store" });
    if (!res.ok) {
      return { data: 0, error: await extractErrorMessage(res, "Failed to count projects") };
    }
    const body = (await res.json()) as { count: number };
    return { data: body.count, error: null };
  } catch (error) {
    console.error("countProjectsAction error:", error);
    return { data: 0, error: "Failed to count projects" };
  }
}

export async function getProjectByIdAction(id: string) {
  if (!GO_API_URL) {
    return { data: null, error: null };
  }
  try {
    const res = await fetch(`${GO_API_URL}/projects/${id}`, { cache: "no-store" });
    if (res.status === 404) {
      return { data: null, error: null };
    }
    if (!res.ok) {
      return { data: null, error: await extractErrorMessage(res, "Failed to fetch project") };
    }
    const row = (await res.json()) as GoProjectResponse;
    return { data: mapGoProject(row), error: null };
  } catch (error) {
    if (isPrerenderError(error)) throw error;
    console.error("getProjectByIdAction error:", error);
    return { data: null, error: "Failed to fetch project" };
  }
}

// resolveProjectDetailAction fetches a project WITH pricing (lowPrice/
// highPrice/offerCount per category) — used only by the public project
// detail page, replacing the old infrastructure/resolveProjectPath.ts's
// "project" branch. See modules/project/presentation/resolveProjectPath.ts.
export async function resolveProjectDetailAction(slug: string) {
  if (!GO_API_URL) {
    return { data: null, error: null };
  }
  try {
    const res = await fetch(`${GO_API_URL}/projects/slug/${slug}?with_pricing=true`, { cache: "no-store" });
    if (res.status === 404) {
      return { data: null, error: null };
    }
    if (!res.ok) {
      return { data: null, error: await extractErrorMessage(res, "Failed to fetch project detail") };
    }
    const row = (await res.json()) as GoProjectResponse;
    return { data: mapGoProject(row), error: null };
  } catch (error) {
    if (isPrerenderError(error)) throw error;
    console.error("resolveProjectDetailAction error:", error);
    return { data: null, error: "Failed to fetch project detail" };
  }
}

export async function getFeaturedProjectsAction(limit: number = 4) {
  return getProjectsAction({ isPublished: true, isFeatured: true, limit });
}

export async function getAdjacentProjectsAction(currentId: string, projectTypeId?: string | null) {
  const empty = { prev: null, next: null };
  if (!GO_API_URL) {
    return { data: empty, error: null };
  }
  try {
    const params = new URLSearchParams({ current_id: currentId });
    if (projectTypeId) params.set("project_type_id", projectTypeId);
    const res = await fetch(`${GO_API_URL}/projects/adjacent?${params.toString()}`, { cache: "no-store" });
    if (!res.ok) {
      return { data: empty, error: await extractErrorMessage(res, "Failed to fetch adjacent projects") };
    }
    const body = (await res.json()) as GoAdjacentProjectsResponse;
    return { data: body, error: null };
  } catch (error) {
    if (isPrerenderError(error)) throw error;
    console.error("getAdjacentProjectsAction error:", error);
    return { data: empty, error: "Failed to fetch adjacent projects" };
  }
}

export async function getCategoriesByProjectTypeIdAction(projectTypeId: string) {
  if (!GO_API_URL) {
    return { data: [] as GoCategoryRefResponse[], error: null };
  }
  try {
    const res = await fetch(`${GO_API_URL}/projects/categories-by-project-type/${projectTypeId}`, { cache: "no-store" });
    if (!res.ok) {
      return { data: [] as GoCategoryRefResponse[], error: await extractErrorMessage(res, "Failed to fetch categories") };
    }
    const rows = (await res.json()) as GoCategoryRefResponse[] | null;
    return { data: rows ?? [], error: null };
  } catch (error) {
    if (isPrerenderError(error)) throw error;
    console.error("getCategoriesByProjectTypeIdAction error:", error);
    return { data: [] as GoCategoryRefResponse[], error: "Failed to fetch categories" };
  }
}

export async function createProjectAction(input: CreateProjectInput) {
  if (!GO_API_URL) {
    return { data: null, error: "GO_API_URL is not configured" };
  }
  try {
    const { categories, ...rest } = input;
    const res = await fetch(`${GO_API_URL}/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...toSnakeCaseBody(rest),
        categories: toGoCategoryConditions(categories),
      }),
    });
    if (!res.ok) {
      return { data: null, error: await extractErrorMessage(res, "Failed to create project") };
    }
    const row = (await res.json()) as GoProjectResponse;
    const data = mapGoProject(row);

    revalidatePaths(data.slug);
    if (data.isPublished && data.slug) {
      const url = `https://dienmayelc.com.vn/du-an/${data.slug}`;
      submitToIndexNow([url]).catch((err) => console.error("IndexNow project create error:", err));
      submitToGoogleIndex([url]).catch((err) => console.error("Google Indexing project create error:", err));
    }
    return { data, error: null };
  } catch (error) {
    console.error("createProjectAction error:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to create project",
    };
  }
}

export async function updateProjectAction(input: UpdateProjectInput) {
  if (!GO_API_URL) {
    return { data: null, error: "GO_API_URL is not configured" };
  }
  try {
    const { id, categories, ...rest } = input;
    const res = await fetch(`${GO_API_URL}/projects/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...toSnakeCaseBody(rest),
        // `categories` must stay a key present in the JSON body (even as
        // `null`/`undefined`→omitted) only when the caller actually means to
        // replace relations — omitting the field entirely here (categories
        // undefined) vs sending `[]` is exactly the "leave untouched" vs
        // "clear all" distinction Go's UpdateProjectInput.Categories
        // (a pointer-to-slice) relies on. See internal/project/domain/types.go.
        ...(categories !== undefined ? { categories: toGoCategoryConditions(categories) } : {}),
      }),
    });
    if (!res.ok) {
      return { data: null, error: await extractErrorMessage(res, "Failed to update project") };
    }
    const row = (await res.json()) as GoProjectResponse;
    const data = mapGoProject(row);

    revalidatePaths(data.slug);
    if (data.isPublished && data.slug) {
      const url = `https://dienmayelc.com.vn/du-an/${data.slug}`;
      submitToIndexNow([url]).catch((err) => console.error("IndexNow project update error:", err));
      submitToGoogleIndex([url]).catch((err) => console.error("Google Indexing project update error:", err));
    }
    return { data, error: null };
  } catch (error) {
    console.error("updateProjectAction error:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to update project",
    };
  }
}

export async function deleteProjectAction(id: string) {
  if (!GO_API_URL) {
    return { error: "GO_API_URL is not configured" };
  }
  try {
    const proj = await getProjectByIdAction(id).then((r) => r.data);
    const res = await fetch(`${GO_API_URL}/projects/${id}`, { method: "DELETE" });
    if (!res.ok) {
      return { error: await extractErrorMessage(res, "Failed to delete project") };
    }
    revalidatePaths(proj?.slug);
    return { error: null };
  } catch (error) {
    console.error("deleteProjectAction error:", error);
    return { error: "Failed to delete project" };
  }
}

export async function toggleProjectPublishAction(id: string, isPublished: boolean) {
  if (!GO_API_URL) {
    return { error: "GO_API_URL is not configured" };
  }
  try {
    const res = await fetch(`${GO_API_URL}/projects/${id}/publish`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value: isPublished }),
    });
    if (!res.ok) {
      return { error: await extractErrorMessage(res, "Failed to toggle publish status") };
    }
    const proj = await getProjectByIdAction(id).then((r) => r.data);
    revalidatePaths(proj?.slug);
    if (isPublished && proj?.slug) {
      const url = `https://dienmayelc.com.vn/du-an/${proj.slug}`;
      submitToIndexNow([url]).catch((err) => console.error("IndexNow project toggle error:", err));
      submitToGoogleIndex([url]).catch((err) => console.error("Google Indexing project toggle error:", err));
    }
    return { error: null };
  } catch (error) {
    console.error("toggleProjectPublishAction error:", error);
    return { error: "Failed to toggle publish status" };
  }
}

export async function toggleProjectFeaturedAction(id: string, isFeatured: boolean) {
  if (!GO_API_URL) {
    return { error: "GO_API_URL is not configured" };
  }
  try {
    const proj = await getProjectByIdAction(id).then((r) => r.data);
    const res = await fetch(`${GO_API_URL}/projects/${id}/featured`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value: isFeatured }),
    });
    if (!res.ok) {
      return { error: await extractErrorMessage(res, "Failed to toggle featured status") };
    }
    revalidatePaths(proj?.slug);
    return { error: null };
  } catch (error) {
    console.error("toggleProjectFeaturedAction error:", error);
    return { error: "Failed to toggle featured status" };
  }
}

export async function updateProjectOrderAction(id: string, orderIndex: number) {
  if (!GO_API_URL) {
    return { error: "GO_API_URL is not configured" };
  }
  try {
    const proj = await getProjectByIdAction(id).then((r) => r.data);
    const res = await fetch(`${GO_API_URL}/projects/${id}/order`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_index: orderIndex }),
    });
    if (!res.ok) {
      return { error: await extractErrorMessage(res, "Failed to update project order") };
    }
    revalidatePaths(proj?.slug);
    return { error: null };
  } catch (error) {
    console.error("updateProjectOrderAction error:", error);
    return { error: "Failed to update project order" };
  }
}

function revalidatePaths(slug?: string) {
  revalidatePath("/admin/projects");
  revalidatePath("/du-an", "layout");
  revalidateTag("projects-list", { expire: 0 });
  if (slug) {
    revalidateTag(`slug:${slug}`, { expire: 0 });
  }
  void purgeCloudflareCache();
}
