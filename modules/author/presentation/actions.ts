"use server";

import { revalidatePath } from "next/cache";
import { Author, AuthorFilter, CreateAuthorInput, UpdateAuthorInput } from "../domain";
import { authHeaders, toSnakeCaseBody } from "@/shared/lib/go-api";

const GO_API_URL = process.env.GO_API_URL;

interface GoAuthorResponse {
  id: string;
  name: string;
  slug: string;
  avatar_url: string;
  bio: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface GoErrorResponse {
  code: string;
  message: string;
  fields?: Record<string, string[]>;
}

function mapGoAuthor(row: GoAuthorResponse): Author {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    avatarUrl: row.avatar_url,
    bio: row.bio,
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

export async function getAuthorsAction(options?: AuthorFilter) {
  if (!GO_API_URL) {
    return { data: [] as Author[], error: null };
  }
  try {
    const params = new URLSearchParams();
    if (options?.search) params.set("search", options.search);
    if (options?.limit) params.set("limit", String(options.limit));
    if (options?.offset) params.set("offset", String(options.offset));
    if (options?.includeDeleted) params.set("include_deleted", "true");

    const res = await fetch(`${GO_API_URL}/authors?${params.toString()}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      return { data: [], error: await extractErrorMessage(res, "Không thể tải danh sách tác giả") };
    }

    const rows = (await res.json()) as GoAuthorResponse[] | null;
    return { data: (rows ?? []).map(mapGoAuthor), error: null };
  } catch (error) {
    console.error("getAuthorsAction error:", error);
    return { data: [], error: "Không thể tải danh sách tác giả" };
  }
}

export async function getAuthorByIdAction(id: string) {
  if (!GO_API_URL) {
    return { data: null, error: null };
  }
  try {
    const res = await fetch(`${GO_API_URL}/authors/${id}`, { cache: "no-store" });
    if (res.status === 404) {
      return { data: null, error: null };
    }
    if (!res.ok) {
      return { data: null, error: await extractErrorMessage(res, "Không thể tải thông tin tác giả") };
    }

    const row = (await res.json()) as GoAuthorResponse;
    return { data: mapGoAuthor(row), error: null };
  } catch (error) {
    console.error("getAuthorByIdAction error:", error);
    return { data: null, error: "Không thể tải thông tin tác giả" };
  }
}

export async function createAuthorAction(input: CreateAuthorInput) {
  if (!GO_API_URL) {
    return { data: null, error: "GO_API_URL is not configured" };
  }
  try {
    const res = await fetch(`${GO_API_URL}/authors`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
      body: JSON.stringify(toSnakeCaseBody(input)),
    });
    if (!res.ok) {
      return { data: null, error: await extractErrorMessage(res, "Không thể tạo tác giả") };
    }

    const row = (await res.json()) as GoAuthorResponse;
    revalidatePath("/admin/authors");
    return { data: mapGoAuthor(row), error: null };
  } catch (error) {
    console.error("createAuthorAction error:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Không thể tạo tác giả",
    };
  }
}

export async function updateAuthorAction(input: UpdateAuthorInput) {
  if (!GO_API_URL) {
    return { data: null, error: "GO_API_URL is not configured" };
  }
  try {
    const { id, ...rest } = input;
    const res = await fetch(`${GO_API_URL}/authors/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
      body: JSON.stringify(toSnakeCaseBody(rest)),
    });
    if (!res.ok) {
      return { data: null, error: await extractErrorMessage(res, "Không thể cập nhật tác giả") };
    }

    const row = (await res.json()) as GoAuthorResponse;
    revalidatePath("/admin/authors");
    return { data: mapGoAuthor(row), error: null };
  } catch (error) {
    console.error("updateAuthorAction error:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Không thể cập nhật tác giả",
    };
  }
}

export async function deleteAuthorAction(id: string) {
  if (!GO_API_URL) {
    return { success: false, error: "GO_API_URL is not configured" };
  }
  try {
    const res = await fetch(`${GO_API_URL}/authors/${id}`, { method: "DELETE", headers: await authHeaders() });
    if (!res.ok) {
      return { success: false, error: await extractErrorMessage(res, "Không thể xóa tác giả") };
    }

    revalidatePath("/admin/authors");
    return { success: true, error: null };
  } catch (error) {
    console.error("deleteAuthorAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Không thể xóa tác giả",
    };
  }
}
