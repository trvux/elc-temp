"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { Brand, BrandFilter, CreateBrandInput, UpdateBrandInput } from "../domain";
import { toSnakeCaseBody } from "@/shared/lib/go-api";

const GO_API_URL = process.env.GO_API_URL;

interface GoBrandResponse {
  id: string;
  name: string;
  slug: string;
  logo_url: string;
  meta_title: string | null;
  meta_description: string | null;
  is_featured: boolean;
  order_index: number;
  content: unknown | null;
  faq: Array<{ question: string; answer: string }> | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface GoErrorResponse {
  code: string;
  message: string;
  fields?: Record<string, string[]>;
}

function mapGoBrand(row: GoBrandResponse): Brand {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    logoUrl: row.logo_url,
    metaTitle: row.meta_title,
    metaDescription: row.meta_description,
    isFeatured: row.is_featured,
    orderIndex: row.order_index,
    content: row.content,
    faq: row.faq,
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

export async function getBrandsAction(options?: BrandFilter) {
  if (!GO_API_URL) {
    return { data: [] as Brand[], error: null };
  }
  try {
    const params = new URLSearchParams();
    if (options?.search) params.set("search", options.search);
    if (options?.limit) params.set("limit", String(options.limit));
    if (options?.offset) params.set("offset", String(options.offset));
    if (options?.includeDeleted) params.set("include_deleted", "true");

    const res = await fetch(`${GO_API_URL}/brands?${params.toString()}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      return { data: [], error: await extractErrorMessage(res, "Không thể tải danh sách thương hiệu") };
    }

    const rows = (await res.json()) as GoBrandResponse[] | null;
    return { data: (rows ?? []).map(mapGoBrand), error: null };
  } catch (error) {
    console.error("getBrandsAction error:", error);
    return { data: [], error: "Không thể tải danh sách thương hiệu" };
  }
}

export async function getBrandByIdAction(id: string) {
  if (!GO_API_URL) {
    return { data: null, error: null };
  }
  try {
    const res = await fetch(`${GO_API_URL}/brands/${id}`, { cache: "no-store" });
    if (res.status === 404) {
      return { data: null, error: null };
    }
    if (!res.ok) {
      return { data: null, error: await extractErrorMessage(res, "Không thể tải thông tin thương hiệu") };
    }

    const row = (await res.json()) as GoBrandResponse;
    return { data: mapGoBrand(row), error: null };
  } catch (error) {
    console.error("getBrandByIdAction error:", error);
    return { data: null, error: "Không thể tải thông tin thương hiệu" };
  }
}

export async function createBrandAction(input: CreateBrandInput) {
  if (!GO_API_URL) {
    return { data: null, error: "GO_API_URL is not configured" };
  }
  try {
    const res = await fetch(`${GO_API_URL}/brands`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toSnakeCaseBody(input)),
    });
    if (!res.ok) {
      return { data: null, error: await extractErrorMessage(res, "Không thể tạo thương hiệu") };
    }

    const row = (await res.json()) as GoBrandResponse;
    revalidatePath("/admin/brands");
    revalidateTag("layout", { expire: 0 });
    return { data: mapGoBrand(row), error: null };
  } catch (error) {
    console.error("createBrandAction error:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Không thể tạo thương hiệu",
    };
  }
}

export async function updateBrandAction(input: UpdateBrandInput) {
  if (!GO_API_URL) {
    return { data: null, error: "GO_API_URL is not configured" };
  }
  try {
    const { id, ...rest } = input;
    const res = await fetch(`${GO_API_URL}/brands/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toSnakeCaseBody(rest)),
    });
    if (!res.ok) {
      return { data: null, error: await extractErrorMessage(res, "Không thể cập nhật thương hiệu") };
    }

    const row = (await res.json()) as GoBrandResponse;
    revalidatePath("/admin/brands");
    revalidateTag("layout", { expire: 0 });
    return { data: mapGoBrand(row), error: null };
  } catch (error) {
    console.error("updateBrandAction error:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Không thể cập nhật thương hiệu",
    };
  }
}

export async function deleteBrandAction(id: string) {
  if (!GO_API_URL) {
    return { success: false, error: "GO_API_URL is not configured" };
  }
  try {
    const res = await fetch(`${GO_API_URL}/brands/${id}`, { method: "DELETE" });
    if (!res.ok) {
      return { success: false, error: await extractErrorMessage(res, "Không thể xóa thương hiệu") };
    }

    revalidatePath("/admin/brands");
    revalidateTag("layout", { expire: 0 });
    return { success: true, error: null };
  } catch (error) {
    console.error("deleteBrandAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Không thể xóa thương hiệu",
    };
  }
}
