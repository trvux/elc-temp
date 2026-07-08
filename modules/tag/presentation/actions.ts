"use server";

import { revalidatePath } from "next/cache";
import { Tag, TagFilter, CreateTagInput, UpdateTagInput } from "../domain";
import { authHeaders, toSnakeCaseBody } from "@/shared/lib/go-api";

const GO_API_URL = process.env.GO_API_URL;

interface GoTagResponse {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface GoErrorResponse {
  code: string;
  message: string;
  fields?: Record<string, string[]>;
}

function mapGoTag(row: GoTagResponse): Tag {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
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

export async function getTagsAction(options?: TagFilter) {
  if (!GO_API_URL) {
    return { data: [] as Tag[], error: null };
  }
  try {
    const params = new URLSearchParams();
    if (options?.search) params.set("search", options.search);
    if (options?.limit) params.set("limit", String(options.limit));
    if (options?.offset) params.set("offset", String(options.offset));
    if (options?.includeDeleted) params.set("include_deleted", "true");

    const res = await fetch(`${GO_API_URL}/tags?${params.toString()}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      return { data: [], error: await extractErrorMessage(res, "Không thể tải danh sách thẻ") };
    }

    const rows = (await res.json()) as GoTagResponse[] | null;
    return { data: (rows ?? []).map(mapGoTag), error: null };
  } catch (error) {
    console.error("getTagsAction error:", error);
    return { data: [], error: "Không thể tải danh sách thẻ" };
  }
}

export async function getTagByIdAction(id: string) {
  if (!GO_API_URL) {
    return { data: null, error: null };
  }
  try {
    const res = await fetch(`${GO_API_URL}/tags/${id}`, { cache: "no-store" });
    if (res.status === 404) {
      return { data: null, error: null };
    }
    if (!res.ok) {
      return { data: null, error: await extractErrorMessage(res, "Không thể tải thông tin thẻ") };
    }

    const row = (await res.json()) as GoTagResponse;
    return { data: mapGoTag(row), error: null };
  } catch (error) {
    console.error("getTagByIdAction error:", error);
    return { data: null, error: "Không thể tải thông tin thẻ" };
  }
}

export async function createTagAction(input: CreateTagInput) {
  if (!GO_API_URL) {
    return { data: null, error: "GO_API_URL is not configured" };
  }
  try {
    const res = await fetch(`${GO_API_URL}/tags`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
      body: JSON.stringify(toSnakeCaseBody(input)),
    });
    if (!res.ok) {
      return { data: null, error: await extractErrorMessage(res, "Không thể tạo thẻ") };
    }

    const row = (await res.json()) as GoTagResponse;
    revalidatePath("/admin/tags");
    return { data: mapGoTag(row), error: null };
  } catch (error) {
    console.error("createTagAction error:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Không thể tạo thẻ",
    };
  }
}

export async function updateTagAction(input: UpdateTagInput) {
  if (!GO_API_URL) {
    return { data: null, error: "GO_API_URL is not configured" };
  }
  try {
    const { id, ...rest } = input;
    const res = await fetch(`${GO_API_URL}/tags/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
      body: JSON.stringify(toSnakeCaseBody(rest)),
    });
    if (!res.ok) {
      return { data: null, error: await extractErrorMessage(res, "Không thể cập nhật thẻ") };
    }

    const row = (await res.json()) as GoTagResponse;
    revalidatePath("/admin/tags");
    return { data: mapGoTag(row), error: null };
  } catch (error) {
    console.error("updateTagAction error:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Không thể cập nhật thẻ",
    };
  }
}

export async function deleteTagAction(id: string) {
  if (!GO_API_URL) {
    return { success: false, error: "GO_API_URL is not configured" };
  }
  try {
    const res = await fetch(`${GO_API_URL}/tags/${id}`, { method: "DELETE", headers: await authHeaders() });
    if (!res.ok) {
      return { success: false, error: await extractErrorMessage(res, "Không thể xóa thẻ") };
    }

    revalidatePath("/admin/tags");
    return { success: true, error: null };
  } catch (error) {
    console.error("deleteTagAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Không thể xóa thẻ",
    };
  }
}
