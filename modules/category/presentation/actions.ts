"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import {
  Category,
  CategoryWithGroup,
  CategoryFilter,
  CreateCategoryInput,
  UpdateCategoryInput,
} from "../domain/types";
import { authHeaders, toSnakeCaseBody } from "@/shared/lib/go-api";
import { purgeCloudflareCache } from "@/shared/lib/cloudflare-purge";

const GO_API_URL = process.env.GO_API_URL;

interface GoGroupRefResponse {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  meta_title: string | null;
  meta_description: string | null;
  is_featured: boolean;
  order_index: number;
}

interface GoCategoryResponse {
  id: string;
  name: string;
  slug: string;
  group_id: string | null;
  group: GoGroupRefResponse | null;
  image_url: string | null;
  meta_title: string | null;
  meta_description: string | null;
  is_featured: boolean;
  order_index: number;
  content: unknown | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface GoErrorResponse {
  code: string;
  message: string;
  fields?: Record<string, string[]>;
}

function mapGoCategory(row: GoCategoryResponse): CategoryWithGroup {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    groupId: row.group_id,
    imageUrl: row.image_url,
    metaTitle: row.meta_title,
    metaDescription: row.meta_description,
    isFeatured: row.is_featured,
    orderIndex: row.order_index,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    group: row.group
      ? {
          id: row.group.id,
          name: row.group.name,
          slug: row.group.slug,
          imageUrl: row.group.image_url,
          metaTitle: row.group.meta_title,
          metaDescription: row.group.meta_description,
          isFeatured: row.group.is_featured,
          orderIndex: row.group.order_index,
          ...emptyGroupTimestamps(),
        }
      : null,
  };
}

// Go's category join only carries the group_categories columns a category
// actually needs (see docs/category.md) — created_at/updated_at/deleted_at
// aren't part of it. Filler so TypeScript's Group type is satisfied without
// lying about data we don't actually have, same convention as
// modules/service/presentation/actions.ts's emptyServiceGroupShape.
function emptyGroupTimestamps() {
  return { createdAt: "", updatedAt: "", deletedAt: null };
}

async function extractErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const body = (await res.json()) as GoErrorResponse;
    return body.message || fallback;
  } catch {
    return fallback;
  }
}

// getCategoriesAction is called from inside "use cache" render functions
// (app/(public)/san-pham/page.tsx, ProductListModule.tsx) — a real fetch
// failure there must propagate so Next.js keeps serving the stale cache
// instead of silently caching an empty category list, same reasoning as
// modules/catalog/presentation/actions.ts's isPrerenderError.
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

export async function getCategoriesAction(filter?: CategoryFilter) {
  if (!GO_API_URL) {
    return { data: [] as CategoryWithGroup[], error: null };
  }
  try {
    const params = new URLSearchParams();
    if (filter?.groupId) params.set("group_id", filter.groupId);
    if (filter?.search) params.set("search", filter.search);
    if (filter?.limit) params.set("limit", String(filter.limit));
    if (filter?.offset) params.set("offset", String(filter.offset));
    if (filter?.includeDeleted) params.set("include_deleted", "true");

    const res = await fetch(`${GO_API_URL}/categories?${params.toString()}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      return { data: [] as CategoryWithGroup[], error: await extractErrorMessage(res, "Failed to fetch categories") };
    }

    const rows = (await res.json()) as GoCategoryResponse[] | null;
    return { data: (rows ?? []).map(mapGoCategory), error: null };
  } catch (error) {
    if (isPrerenderError(error)) throw error;
    console.error("getCategoriesAction error:", error);
    return { data: [] as CategoryWithGroup[], error: "Failed to fetch categories" };
  }
}

export async function getCategoryByIdAction(id: string) {
  if (!GO_API_URL) {
    return { data: null, error: null };
  }
  try {
    const res = await fetch(`${GO_API_URL}/categories/${id}`, { cache: "no-store" });
    if (res.status === 404) {
      return { data: null, error: null };
    }
    if (!res.ok) {
      return { data: null, error: await extractErrorMessage(res, "Failed to fetch category") };
    }

    const row = (await res.json()) as GoCategoryResponse;
    return { data: mapGoCategory(row), error: null };
  } catch (error) {
    if (isPrerenderError(error)) throw error;
    console.error("getCategoryByIdAction error:", error);
    return { data: null, error: "Failed to fetch category" };
  }
}

export async function getCategoryBySlugAction(slug: string) {
  if (!GO_API_URL) {
    return { data: null, error: null };
  }
  try {
    const res = await fetch(`${GO_API_URL}/categories/slug/${encodeURIComponent(slug)}`, { cache: "no-store" });
    if (res.status === 404) {
      return { data: null, error: null };
    }
    if (!res.ok) {
      return { data: null, error: await extractErrorMessage(res, "Failed to fetch category") };
    }

    const row = (await res.json()) as GoCategoryResponse;
    return { data: mapGoCategory(row), error: null };
  } catch (error) {
    if (isPrerenderError(error)) throw error;
    console.error("getCategoryBySlugAction error:", error);
    return { data: null, error: "Failed to fetch category" };
  }
}

export async function createCategoryAction(input: CreateCategoryInput) {
  if (!GO_API_URL) {
    return { data: null, error: "GO_API_URL is not configured" };
  }
  try {
    const res = await fetch(`${GO_API_URL}/categories`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
      body: JSON.stringify(toSnakeCaseBody(input)),
    });
    if (!res.ok) {
      return { data: null, error: await extractErrorMessage(res, "Failed to create category") };
    }

    const row = (await res.json()) as GoCategoryResponse;
    revalidatePath("/admin/categories");
    revalidateTag("layout", { expire: 0 });
    revalidateTag("products", { expire: 0 });
    await purgeCloudflareCache();
    return { data: mapGoCategory(row) as Category, error: null };
  } catch (error) {
    console.error("createCategoryAction error:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to create category",
    };
  }
}

export async function updateCategoryAction(input: UpdateCategoryInput) {
  if (!GO_API_URL) {
    return { data: null, error: "GO_API_URL is not configured" };
  }
  try {
    const { id, ...rest } = input;
    const res = await fetch(`${GO_API_URL}/categories/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
      body: JSON.stringify(toSnakeCaseBody(rest)),
    });
    if (!res.ok) {
      return { data: null, error: await extractErrorMessage(res, "Failed to update category") };
    }

    const row = (await res.json()) as GoCategoryResponse;
    revalidatePath("/admin/categories");
    revalidateTag("layout", { expire: 0 });
    revalidateTag("products", { expire: 0 });
    await purgeCloudflareCache();
    return { data: mapGoCategory(row) as Category, error: null };
  } catch (error) {
    console.error("updateCategoryAction error:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to update category",
    };
  }
}

export async function deleteCategoryAction(id: string) {
  if (!GO_API_URL) {
    return { error: "GO_API_URL is not configured" };
  }
  try {
    const res = await fetch(`${GO_API_URL}/categories/${id}`, { method: "DELETE", headers: await authHeaders() });
    if (!res.ok) {
      return { error: await extractErrorMessage(res, "Failed to delete category") };
    }

    revalidatePath("/admin/categories");
    revalidateTag("layout", { expire: 0 });
    revalidateTag("products", { expire: 0 });
    await purgeCloudflareCache();
    return { error: null };
  } catch (error) {
    console.error("deleteCategoryAction error:", error);
    return {
      error: error instanceof Error ? error.message : "Failed to delete category",
    };
  }
}
