"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { News, CreateNewsInput, UpdateNewsInput, NewsFilter, ImageAsset } from "../domain";
import { authHeaders, toSnakeCaseBody } from "@/shared/lib/go-api";
import { submitToIndexNow } from "@/shared/lib/indexnow";
import { warmCache } from "@/shared/lib/cache-warm";
import { BASE_URL } from "@/shared/lib/seo-schema";

const GO_API_URL = process.env.GO_API_URL;

interface GoSeo {
  title?: string;
  description?: string;
  noindex?: boolean;
}

interface GoNewsResponse {
  id: string;
  title: string;
  slug: string;
  images: ImageAsset[];
  content: unknown;
  excerpt: string;
  category_id: string | null;
  author_id: string | null;
  is_published: boolean;
  meta_title: string | null;
  meta_description: string | null;
  seo: GoSeo;
  order_index: number;
  tags: { id: string; name: string; slug: string }[] | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface GoErrorResponse {
  code: string;
  message: string;
  fields?: Record<string, string[]>;
}

function mapGoNews(row: GoNewsResponse): News {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    images: row.images || [],
    content: row.content as News["content"],
    excerpt: row.excerpt,
    categoryId: row.category_id,
    authorId: row.author_id,
    isPublished: row.is_published,
    metaTitle: row.meta_title,
    metaDescription: row.meta_description,
    seo: row.seo,
    orderIndex: row.order_index,
    tags: row.tags ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
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

// isPrerenderError re-throws Next.js's own internal prerendering-abort
// signal instead of swallowing it — see
// modules/category/presentation/actions.ts's identical helper.
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

function buildNewsFilterParams(filter?: NewsFilter): URLSearchParams {
  const params = new URLSearchParams();
  if (!filter) return params;
  if (filter.isPublished !== undefined) params.set("is_published", String(filter.isPublished));
  if (filter.search) params.set("search", filter.search);
  if (filter.categoryId) params.set("category_id", filter.categoryId);
  if (filter.excludeId) params.set("exclude_id", filter.excludeId);
  if (filter.limit !== undefined) params.set("limit", String(filter.limit));
  if (filter.offset !== undefined) params.set("offset", String(filter.offset));
  if (filter.includeDeleted) params.set("include_deleted", "true");
  if (filter.sortBy) params.set("sort_by", filter.sortBy);
  if (filter.sortOrder) params.set("sort_order", filter.sortOrder);
  return params;
}

export async function getNewsAction(options?: NewsFilter) {
  if (!GO_API_URL) {
    return { data: [] as News[], error: null };
  }
  try {
    const params = buildNewsFilterParams(options);
    const res = await fetch(`${GO_API_URL}/news?${params.toString()}`, { cache: "no-store" });
    if (!res.ok) {
      return { data: [] as News[], error: await extractErrorMessage(res, "Failed to fetch news") };
    }
    const rows = (await res.json()) as GoNewsResponse[] | null;
    return { data: (rows ?? []).map(mapGoNews), error: null };
  } catch (error) {
    if (isPrerenderError(error)) throw error;
    console.error("getNewsAction error:", error);
    return { data: [] as News[], error: "Failed to fetch news" };
  }
}

export async function countNewsAction(options?: NewsFilter) {
  if (!GO_API_URL) {
    return { data: 0, error: null };
  }
  try {
    const params = buildNewsFilterParams(options);
    const res = await fetch(`${GO_API_URL}/news/count?${params.toString()}`, { cache: "no-store" });
    if (!res.ok) {
      return { data: 0, error: await extractErrorMessage(res, "Failed to count news") };
    }
    const body = (await res.json()) as { count: number };
    return { data: body.count, error: null };
  } catch (error) {
    console.error("countNewsAction error:", error);
    return { data: 0, error: "Failed to count news" };
  }
}

export async function getNewsBySlugAction(slug: string) {
  if (!GO_API_URL) {
    return { data: null, error: null };
  }
  try {
    const res = await fetch(`${GO_API_URL}/news/slug/${slug}`, { cache: "no-store" });
    if (res.status === 404) {
      return { data: null, error: null };
    }
    if (!res.ok) {
      return { data: null, error: await extractErrorMessage(res, "Failed to fetch news") };
    }
    const row = (await res.json()) as GoNewsResponse;
    return { data: mapGoNews(row), error: null };
  } catch (error) {
    if (isPrerenderError(error)) throw error;
    console.error("getNewsBySlugAction error:", error);
    return { data: null, error: "Failed to fetch news" };
  }
}

export async function createNewsAction(input: CreateNewsInput) {
  if (!GO_API_URL) {
    return { data: null, error: "GO_API_URL is not configured" };
  }
  try {
    const res = await fetch(`${GO_API_URL}/news`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
      body: JSON.stringify(toSnakeCaseBody(input)),
    });
    if (!res.ok) {
      return { data: null, error: await extractErrorMessage(res, "Failed to create news") };
    }
    const row = (await res.json()) as GoNewsResponse;
    const data = mapGoNews(row);

    revalidatePaths(data.slug);
    if (data.isPublished && data.slug) {
      const url = `${BASE_URL}/tin-tuc/${data.slug}`;
      submitToIndexNow([url]).catch((err) => console.error("IndexNow news create error:", err));
      warmCache([url]);
    }
    return { data, error: null };
  } catch (error) {
    console.error("createNewsAction error:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to create news",
    };
  }
}

export async function updateNewsAction(input: UpdateNewsInput) {
  if (!GO_API_URL) {
    return { data: null, error: "GO_API_URL is not configured" };
  }
  try {
    const { id, ...rest } = input;
    const res = await fetch(`${GO_API_URL}/news/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
      body: JSON.stringify(toSnakeCaseBody(rest)),
    });
    if (!res.ok) {
      return { data: null, error: await extractErrorMessage(res, "Failed to update news") };
    }
    const row = (await res.json()) as GoNewsResponse;
    const data = mapGoNews(row);

    revalidatePaths(data.slug);
    if (data.isPublished && data.slug) {
      const url = `${BASE_URL}/tin-tuc/${data.slug}`;
      submitToIndexNow([url]).catch((err) => console.error("IndexNow news update error:", err));
      warmCache([url]);
    }
    return { data, error: null };
  } catch (error) {
    console.error("updateNewsAction error:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to update news",
    };
  }
}

export async function deleteNewsAction(id: string) {
  if (!GO_API_URL) {
    return { success: false, error: "GO_API_URL is not configured" };
  }
  try {
    const existing = await getNewsByIdAction(id).then((r) => r.data);
    const res = await fetch(`${GO_API_URL}/news/${id}`, { method: "DELETE", headers: await authHeaders() });
    if (!res.ok) {
      return { success: false, error: await extractErrorMessage(res, "Failed to delete news") };
    }
    revalidatePaths(existing?.slug);
    return { success: true, error: null };
  } catch (error) {
    console.error("deleteNewsAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete news",
    };
  }
}

async function getNewsByIdAction(id: string) {
  if (!GO_API_URL) {
    return { data: null, error: null };
  }
  try {
    const res = await fetch(`${GO_API_URL}/news/${id}`, { cache: "no-store" });
    if (res.status === 404) {
      return { data: null, error: null };
    }
    if (!res.ok) {
      return { data: null, error: await extractErrorMessage(res, "Failed to fetch news") };
    }
    const row = (await res.json()) as GoNewsResponse;
    return { data: mapGoNews(row), error: null };
  } catch (error) {
    console.error("getNewsByIdAction error:", error);
    return { data: null, error: "Failed to fetch news" };
  }
}

function revalidatePaths(slug?: string) {
  revalidatePath("/admin/news");
  revalidatePath("/tin-tuc");
  revalidateTag("news-list", { expire: 0 });
  if (slug) {
    revalidatePath(`/tin-tuc/${slug}`);
    revalidateTag(`news-slug:${slug}`, { expire: 0 });
  }
}
