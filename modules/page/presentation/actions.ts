"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { CreatePageInput, Page, UpdatePageInput } from "../domain";
import { authHeaders } from "@/shared/lib/go-api";

const GO_API_URL = process.env.GO_API_URL;

interface GoPageResponse {
  id: string;
  title: string;
  slug: string;
  content: unknown;
  is_published: boolean;
  meta_title: string | null;
  meta_description: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface GoErrorResponse {
  code: string;
  message: string;
}

function mapPageToDomain(row: GoPageResponse): Page {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    content: row.content as Page["content"],
    isPublished: row.is_published,
    metaTitle: row.meta_title,
    metaDescription: row.meta_description,
    orderIndex: row.order_index,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

function isPrerenderError(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    const name = error.name;
    return (
      name === "AbortError" ||
      msg.includes("aborted") ||
      msg.includes("abort") ||
      msg.includes("prerendering") ||
      msg.includes("prerender")
    );
  }
  return false;
}

async function extractErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const body = (await res.json()) as GoErrorResponse;
    return body.message || fallback;
  } catch {
    return fallback;
  }
}

export async function getPagesAction(options?: { isPublished?: boolean }) {
  if (!GO_API_URL) {
    return { data: [] as Page[], error: null };
  }
  try {
    const params = new URLSearchParams();
    if (options?.isPublished !== undefined) params.set("is_published", String(options.isPublished));
    const res = await fetch(`${GO_API_URL}/pages?${params.toString()}`, { cache: "no-store" });
    if (!res.ok) {
      return { data: [], error: await extractErrorMessage(res, "Không thể tải danh sách trang") };
    }
    const rows = (await res.json()) as GoPageResponse[] | null;
    return { data: (rows ?? []).map(mapPageToDomain), error: null };
  } catch (error) {
    if (isPrerenderError(error)) throw error;
    console.error("getPagesAction error:", error);
    return { data: [], error: "Không thể tải danh sách trang" };
  }
}

export async function getPageBySlugAction(slug: string) {
  if (!GO_API_URL) {
    return { data: null as Page | null, error: null };
  }
  try {
    const res = await fetch(`${GO_API_URL}/pages/slug/${slug}`, { cache: "no-store" });
    if (!res.ok) {
      if (res.status === 404) {
        return { data: null, error: null };
      }
      return { data: null, error: await extractErrorMessage(res, "Không thể tải thông tin trang") };
    }
    const row = (await res.json()) as GoPageResponse;
    return { data: mapPageToDomain(row), error: null };
  } catch (error) {
    if (isPrerenderError(error)) throw error;
    console.error("getPageBySlugAction error:", error);
    return { data: null, error: "Không thể tải thông tin trang" };
  }
}

export async function createPageAction(input: CreatePageInput) {
  if (!GO_API_URL) {
    return { data: null as Page | null, error: "GO_API_URL is not configured" };
  }
  try {
    const res = await fetch(`${GO_API_URL}/pages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
      body: JSON.stringify({
        title: input.title,
        slug: input.slug,
        content: input.content,
        is_published: input.isPublished ?? true,
        meta_title: input.metaTitle,
        meta_description: input.metaDescription,
        order_index: input.orderIndex ?? 0,
      }),
    });
    if (!res.ok) {
      return { data: null, error: await extractErrorMessage(res, "Không thể tạo trang mới") };
    }
    const row = (await res.json()) as GoPageResponse;
    const domainPage = mapPageToDomain(row);

    revalidatePath("/admin/pages");
    revalidatePath(`/${domainPage.slug}`);
    revalidateTag("layout", { expire: 0 });
    return { data: domainPage, error: null };
  } catch (error) {
    if (isPrerenderError(error)) throw error;
    console.error("createPageAction error:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Không thể tạo trang mới",
    };
  }
}

export async function updatePageAction(input: UpdatePageInput) {
  if (!GO_API_URL) {
    return { data: null as Page | null, error: "GO_API_URL is not configured" };
  }
  try {
    const res = await fetch(`${GO_API_URL}/pages/${input.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
      body: JSON.stringify({
        title: input.title,
        slug: input.slug,
        content: input.content,
        is_published: input.isPublished,
        meta_title: input.metaTitle,
        meta_description: input.metaDescription,
        order_index: input.orderIndex,
      }),
    });
    if (!res.ok) {
      return { data: null, error: await extractErrorMessage(res, "Không thể cập nhật trang") };
    }
    const row = (await res.json()) as GoPageResponse;
    const domainPage = mapPageToDomain(row);

    revalidatePath("/admin/pages");
    revalidatePath(`/${domainPage.slug}`);
    revalidateTag("layout", { expire: 0 });
    return { data: domainPage, error: null };
  } catch (error) {
    if (isPrerenderError(error)) throw error;
    console.error("updatePageAction error:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Không thể cập nhật trang",
    };
  }
}

export async function deletePageAction(id: string) {
  if (!GO_API_URL) {
    return { success: false, error: "GO_API_URL is not configured" };
  }
  try {
    const res = await fetch(`${GO_API_URL}/pages/${id}`, {
      method: "DELETE",
      headers: await authHeaders(),
    });
    if (!res.ok) {
      return { success: false, error: await extractErrorMessage(res, "Không thể xóa trang") };
    }

    revalidatePath("/admin/pages");
    revalidateTag("layout", { expire: 0 });
    return { success: true, error: null };
  } catch (error) {
    if (isPrerenderError(error)) throw error;
    console.error("deletePageAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Không thể xóa trang",
    };
  }
}
