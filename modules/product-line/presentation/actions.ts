"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import {
  ProductLine,
  ProductLineFilter,
  CreateProductLineInput,
  UpdateProductLineInput,
} from "../domain";
import { authHeaders, toSnakeCaseBody } from "@/shared/lib/go-api";

const GO_API_URL = process.env.GO_API_URL;

interface GoProductLineResponse {
  id: string;
  brand_id: string;
  category_id: string | null;
  code: string;
  name: string;
  tier_rank: number;
  description: string | null;
  mpn_prefixes: string[] | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface GoErrorResponse {
  code: string;
  message: string;
  fields?: Record<string, string[]>;
}

function mapGoProductLine(row: GoProductLineResponse): ProductLine {
  return {
    id: row.id,
    brandId: row.brand_id,
    categoryId: row.category_id,
    code: row.code,
    name: row.name,
    tierRank: row.tier_rank,
    description: row.description,
    mpnPrefixes: row.mpn_prefixes ?? [],
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

export async function getProductLinesAction(filter?: ProductLineFilter) {
  if (!GO_API_URL) {
    return { data: [] as ProductLine[], error: null };
  }
  try {
    const params = new URLSearchParams();
    if (filter?.brandId) params.set("brand_id", filter.brandId);
    if (filter?.includeDeleted) params.set("include_deleted", "true");

    const res = await fetch(`${GO_API_URL}/product-lines?${params.toString()}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      return { data: [], error: await extractErrorMessage(res, "Không thể tải danh sách dòng sản phẩm") };
    }

    const rows = (await res.json()) as GoProductLineResponse[] | null;
    return { data: (rows ?? []).map(mapGoProductLine), error: null };
  } catch (error) {
    console.error("getProductLinesAction error:", error);
    return { data: [], error: "Không thể tải danh sách dòng sản phẩm" };
  }
}

export async function getProductLineByIdAction(id: string) {
  if (!GO_API_URL) {
    return { data: null, error: null };
  }
  try {
    const res = await fetch(`${GO_API_URL}/product-lines/${id}`, { cache: "no-store" });
    if (res.status === 404) {
      return { data: null, error: null };
    }
    if (!res.ok) {
      return { data: null, error: await extractErrorMessage(res, "Không thể tải thông tin dòng sản phẩm") };
    }

    const row = (await res.json()) as GoProductLineResponse;
    return { data: mapGoProductLine(row), error: null };
  } catch (error) {
    console.error("getProductLineByIdAction error:", error);
    return { data: null, error: "Không thể tải thông tin dòng sản phẩm" };
  }
}

export async function createProductLineAction(input: CreateProductLineInput) {
  if (!GO_API_URL) {
    return { data: null, error: "GO_API_URL is not configured" };
  }
  try {
    const res = await fetch(`${GO_API_URL}/product-lines`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
      body: JSON.stringify(toSnakeCaseBody(input)),
    });
    if (!res.ok) {
      return { data: null, error: await extractErrorMessage(res, "Không thể tạo dòng sản phẩm") };
    }

    const row = (await res.json()) as GoProductLineResponse;
    revalidatePath("/admin/product-lines");
    revalidateTag("layout", { expire: 0 });
    return { data: mapGoProductLine(row), error: null };
  } catch (error) {
    console.error("createProductLineAction error:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Không thể tạo dòng sản phẩm",
    };
  }
}

export async function updateProductLineAction(input: UpdateProductLineInput) {
  if (!GO_API_URL) {
    return { data: null, error: "GO_API_URL is not configured" };
  }
  try {
    const { id, ...rest } = input;
    const res = await fetch(`${GO_API_URL}/product-lines/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
      body: JSON.stringify(toSnakeCaseBody(rest)),
    });
    if (!res.ok) {
      return { data: null, error: await extractErrorMessage(res, "Không thể cập nhật dòng sản phẩm") };
    }

    const row = (await res.json()) as GoProductLineResponse;
    revalidatePath("/admin/product-lines");
    revalidateTag("layout", { expire: 0 });
    return { data: mapGoProductLine(row), error: null };
  } catch (error) {
    console.error("updateProductLineAction error:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Không thể cập nhật dòng sản phẩm",
    };
  }
}

export async function deleteProductLineAction(id: string) {
  if (!GO_API_URL) {
    return { success: false, error: "GO_API_URL is not configured" };
  }
  try {
    const res = await fetch(`${GO_API_URL}/product-lines/${id}`, { method: "DELETE", headers: await authHeaders() });
    if (!res.ok) {
      return { success: false, error: await extractErrorMessage(res, "Không thể xóa dòng sản phẩm") };
    }

    revalidatePath("/admin/product-lines");
    revalidateTag("layout", { expire: 0 });
    return { success: true, error: null };
  } catch (error) {
    console.error("deleteProductLineAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Không thể xóa dòng sản phẩm",
    };
  }
}
