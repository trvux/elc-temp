"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import {
  ProjectType,
  ProjectTypeWithCategories,
  CreateProjectTypeInput,
  UpdateProjectTypeInput,
} from "../domain/types";
import { authHeaders, toSnakeCaseBody } from "@/shared/lib/go-api";
import { purgeCloudflareCache } from "@/shared/lib/cloudflare-purge";

const GO_API_URL = process.env.GO_API_URL;

interface GoCategoryGroupRefResponse {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  meta_title: string | null;
  meta_description: string | null;
  is_featured: boolean;
  order_index: number;
}

interface GoCategoryRefResponse {
  id: string;
  name: string;
  group_id: string | null;
  slug: string;
  image_url: string | null;
  meta_title: string | null;
  meta_description: string | null;
  is_featured: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  group: GoCategoryGroupRefResponse | null;
}

interface GoProjectTypeResponse {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  meta_title: string | null;
  meta_description: string | null;
  is_featured: boolean;
  order_index: number;
  categories: GoCategoryRefResponse[] | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface GoErrorResponse {
  code: string;
  message: string;
  fields?: Record<string, string[]>;
}

// Go's project type join only carries the categories/group columns the
// admin UI actually needs (see docs/project-type.md) — content/faq on the
// nested category and created_at/updated_at/deleted_at on the nested group
// aren't part of it. Fillers so TypeScript's CategoryWithGroup/Group types
// are satisfied without lying about data we don't actually have, same
// convention as modules/category/presentation/actions.ts's emptyGroupTimestamps.
function emptyGroupTimestamps() {
  return { createdAt: "", updatedAt: "", deletedAt: null };
}

function mapGoProjectType(row: GoProjectTypeResponse): ProjectTypeWithCategories {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    image: row.image,
    metaTitle: row.meta_title,
    metaDescription: row.meta_description,
    isFeatured: row.is_featured,
    orderIndex: row.order_index,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    categories: (row.categories ?? []).map((cat) => ({
      id: cat.id,
      name: cat.name,
      groupId: cat.group_id,
      slug: cat.slug,
      imageUrl: cat.image_url,
      metaTitle: cat.meta_title,
      metaDescription: cat.meta_description,
      isFeatured: cat.is_featured,
      orderIndex: cat.order_index,
      createdAt: cat.created_at,
      updatedAt: cat.updated_at,
      deletedAt: cat.deleted_at,
      group: cat.group
        ? {
            id: cat.group.id,
            name: cat.group.name,
            slug: cat.group.slug,
            imageUrl: cat.group.image_url,
            metaTitle: cat.group.meta_title,
            metaDescription: cat.group.meta_description,
            isFeatured: cat.group.is_featured,
            orderIndex: cat.group.order_index,
            ...emptyGroupTimestamps(),
          }
        : null,
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

// isPrerenderError mirrors modules/category/presentation/actions.ts's own
// helper — getProjectTypesAction is called from ProjectListModule.tsx inside
// a "use cache" render function, so a real fetch failure there must
// propagate rather than silently cache an empty list.
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

export async function getProjectTypesAction() {
  if (!GO_API_URL) {
    return { data: [] as ProjectTypeWithCategories[], error: null };
  }
  try {
    const res = await fetch(`${GO_API_URL}/project-types`, { cache: "no-store" });
    if (!res.ok) {
      return { data: [] as ProjectTypeWithCategories[], error: await extractErrorMessage(res, "Failed to fetch service types") };
    }

    const rows = (await res.json()) as GoProjectTypeResponse[] | null;
    return { data: (rows ?? []).map(mapGoProjectType), error: null };
  } catch (error) {
    if (isPrerenderError(error)) throw error;
    console.error("getProjectTypesAction error:", error);
    return { data: [] as ProjectTypeWithCategories[], error: "Failed to fetch service types" };
  }
}

export async function getProjectTypeByIdAction(id: string) {
  if (!GO_API_URL) {
    return { data: null, error: null };
  }
  try {
    const res = await fetch(`${GO_API_URL}/project-types/${id}`, { cache: "no-store" });
    if (res.status === 404) {
      return { data: null, error: null };
    }
    if (!res.ok) {
      return { data: null, error: await extractErrorMessage(res, "Failed to fetch service type") };
    }

    const row = (await res.json()) as GoProjectTypeResponse;
    return { data: mapGoProjectType(row), error: null };
  } catch (error) {
    if (isPrerenderError(error)) throw error;
    console.error("getProjectTypeByIdAction error:", error);
    return { data: null, error: "Failed to fetch service type" };
  }
}

export async function createProjectTypeAction(input: CreateProjectTypeInput) {
  if (!GO_API_URL) {
    return { data: null, error: "GO_API_URL is not configured" };
  }
  try {
    const res = await fetch(`${GO_API_URL}/project-types`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
      body: JSON.stringify(toSnakeCaseBody(input)),
    });
    if (!res.ok) {
      return { data: null, error: await extractErrorMessage(res, "Failed to create service type") };
    }

    const row = (await res.json()) as GoProjectTypeResponse;
    revalidatePath("/admin/project-types");
    revalidateTag("layout", { expire: 0 });
    revalidateTag("projects", { expire: 0 });
    await purgeCloudflareCache();
    return { data: mapGoProjectType(row) as ProjectType, error: null };
  } catch (error) {
    console.error("createProjectTypeAction error:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to create service type",
    };
  }
}

export async function updateProjectTypeAction(input: UpdateProjectTypeInput) {
  if (!GO_API_URL) {
    return { data: null, error: "GO_API_URL is not configured" };
  }
  try {
    const { id, ...rest } = input;
    const res = await fetch(`${GO_API_URL}/project-types/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
      body: JSON.stringify(toSnakeCaseBody(rest)),
    });
    if (!res.ok) {
      return { data: null, error: await extractErrorMessage(res, "Failed to update service type") };
    }

    const row = (await res.json()) as GoProjectTypeResponse;
    revalidatePath("/admin/project-types");
    revalidateTag("layout", { expire: 0 });
    revalidateTag("projects", { expire: 0 });
    await purgeCloudflareCache();
    return { data: mapGoProjectType(row) as ProjectType, error: null };
  } catch (error) {
    console.error("updateProjectTypeAction error:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to update service type",
    };
  }
}

export async function deleteProjectTypeAction(id: string) {
  if (!GO_API_URL) {
    return { error: "GO_API_URL is not configured" };
  }
  try {
    const res = await fetch(`${GO_API_URL}/project-types/${id}`, { method: "DELETE", headers: await authHeaders() });
    if (!res.ok) {
      return { error: await extractErrorMessage(res, "Failed to delete service type") };
    }

    revalidatePath("/admin/project-types");
    revalidateTag("layout", { expire: 0 });
    revalidateTag("projects", { expire: 0 });
    await purgeCloudflareCache();
    return { error: null };
  } catch (error) {
    console.error("deleteProjectTypeAction error:", error);
    return {
      error: error instanceof Error ? error.message : "Failed to delete service type",
    };
  }
}
