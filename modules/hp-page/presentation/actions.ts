"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { HpPage, HpPageFilter, CreateHpPageInput, UpdateHpPageInput } from "../domain";
import { authHeaders, toSnakeCaseBody } from "@/shared/lib/go-api";

const GO_API_URL = process.env.GO_API_URL;

interface GoHpPageResponse {
  id: string;
  name: string;
  slug: string;
  image_url: string;
  meta_title: string | null;
  meta_description: string | null;
  order_index: number;
  content: unknown | null;
  attribute_code: string;
  attribute_values: string[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface GoErrorResponse {
  code: string;
  message: string;
  fields?: Record<string, string[]>;
}

function mapGoHpPage(row: GoHpPageResponse): HpPage {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    imageUrl: row.image_url,
    metaTitle: row.meta_title,
    metaDescription: row.meta_description,
    orderIndex: row.order_index,
    content: row.content,
    attributeCode: row.attribute_code,
    attributeValues: row.attribute_values,
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

export async function getHpPagesAction(options?: HpPageFilter) {
  if (!GO_API_URL) {
    return { data: [] as HpPage[], error: null };
  }
  try {
    const params = new URLSearchParams();
    if (options?.search) params.set("search", options.search);
    if (options?.limit) params.set("limit", String(options.limit));
    if (options?.offset) params.set("offset", String(options.offset));
    if (options?.includeDeleted) params.set("include_deleted", "true");

    const res = await fetch(`${GO_API_URL}/hp-pages?${params.toString()}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      return { data: [], error: await extractErrorMessage(res, "Không thể tải danh sách trang công suất") };
    }

    const rows = (await res.json()) as GoHpPageResponse[] | null;
    return { data: (rows ?? []).map(mapGoHpPage), error: null };
  } catch (error) {
    console.error("getHpPagesAction error:", error);
    return { data: [], error: "Không thể tải danh sách trang công suất" };
  }
}

export async function getHpPageByIdAction(id: string) {
  if (!GO_API_URL) {
    return { data: null, error: null };
  }
  try {
    const res = await fetch(`${GO_API_URL}/hp-pages/${id}`, { cache: "no-store" });
    if (res.status === 404) {
      return { data: null, error: null };
    }
    if (!res.ok) {
      return { data: null, error: await extractErrorMessage(res, "Không thể tải thông tin trang công suất") };
    }

    const row = (await res.json()) as GoHpPageResponse;
    return { data: mapGoHpPage(row), error: null };
  } catch (error) {
    console.error("getHpPageByIdAction error:", error);
    return { data: null, error: "Không thể tải thông tin trang công suất" };
  }
}

export async function createHpPageAction(input: CreateHpPageInput) {
  if (!GO_API_URL) {
    return { data: null, error: "GO_API_URL is not configured" };
  }
  try {
    const res = await fetch(`${GO_API_URL}/hp-pages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
      body: JSON.stringify(toSnakeCaseBody(input)),
    });
    if (!res.ok) {
      return { data: null, error: await extractErrorMessage(res, "Không thể tạo trang công suất") };
    }

    const row = (await res.json()) as GoHpPageResponse;
    revalidatePath("/admin/hp-pages");
    revalidateTag("layout", { expire: 0 });
    return { data: mapGoHpPage(row), error: null };
  } catch (error) {
    console.error("createHpPageAction error:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Không thể tạo trang công suất",
    };
  }
}

export async function updateHpPageAction(input: UpdateHpPageInput) {
  if (!GO_API_URL) {
    return { data: null, error: "GO_API_URL is not configured" };
  }
  try {
    const { id, ...rest } = input;
    const res = await fetch(`${GO_API_URL}/hp-pages/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
      body: JSON.stringify(toSnakeCaseBody(rest)),
    });
    if (!res.ok) {
      return { data: null, error: await extractErrorMessage(res, "Không thể cập nhật trang công suất") };
    }

    const row = (await res.json()) as GoHpPageResponse;
    revalidatePath("/admin/hp-pages");
    revalidateTag("layout", { expire: 0 });
    return { data: mapGoHpPage(row), error: null };
  } catch (error) {
    console.error("updateHpPageAction error:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Không thể cập nhật trang công suất",
    };
  }
}

export async function deleteHpPageAction(id: string) {
  if (!GO_API_URL) {
    return { success: false, error: "GO_API_URL is not configured" };
  }
  try {
    const res = await fetch(`${GO_API_URL}/hp-pages/${id}`, { method: "DELETE", headers: await authHeaders() });
    if (!res.ok) {
      return { success: false, error: await extractErrorMessage(res, "Không thể xóa trang công suất") };
    }

    revalidatePath("/admin/hp-pages");
    revalidateTag("layout", { expire: 0 });
    return { success: true, error: null };
  } catch (error) {
    console.error("deleteHpPageAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Không thể xóa trang công suất",
    };
  }
}
