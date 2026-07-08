"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { Branch, CreateBranchInput, UpdateBranchInput, BranchFilter, Json, ImageAsset } from "../domain";
import { authHeaders, toSnakeCaseBody } from "@/shared/lib/go-api";
import { purgeCloudflareCache } from "@/shared/lib/cloudflare-purge";

const GO_API_URL = process.env.GO_API_URL;

interface GoBranchResponse {
  id: string;
  name: string;
  slug: string;
  address: string;
  phone: string;
  email: string;
  maps_url: string;
  maps_embed: string;
  description: Json;
  images: ImageAsset[];
  is_published: boolean;
  order_index: number;
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface GoErrorResponse {
  code: string;
  message: string;
  fields?: Record<string, string[]>;
}

function mapGoBranch(row: GoBranchResponse): Branch {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    address: row.address,
    phone: row.phone,
    email: row.email,
    mapsUrl: row.maps_url,
    mapsEmbed: row.maps_embed,
    description: row.description,
    images: row.images || [],
    isPublished: row.is_published,
    orderIndex: row.order_index,
    metaTitle: row.meta_title,
    metaDescription: row.meta_description,
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

export async function getBranchesAction(options?: BranchFilter) {
  if (!GO_API_URL) {
    return { data: [] as Branch[], error: null };
  }
  try {
    const params = new URLSearchParams();
    if (options?.isPublished !== undefined) params.set("is_published", String(options.isPublished));
    if (options?.search) params.set("search", options.search);
    if (options?.limit) params.set("limit", String(options.limit));
    if (options?.offset) params.set("offset", String(options.offset));

    const res = await fetch(`${GO_API_URL}/branches?${params.toString()}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      return { data: [], error: await extractErrorMessage(res, "Không thể tải danh sách chi nhánh") };
    }

    const rows = (await res.json()) as GoBranchResponse[] | null;
    return { data: (rows ?? []).map(mapGoBranch), error: null };
  } catch (error) {
    if (isPrerenderError(error)) throw error;
    console.error("getBranchesAction error:", error);
    return { data: [], error: "Không thể tải danh sách chi nhánh" };
  }
}

export async function getBranchesWithCountAction(options?: BranchFilter) {
  if (!GO_API_URL) {
    return { data: [] as Branch[], total: 0, error: null };
  }
  try {
    const params = new URLSearchParams();
    if (options?.isPublished !== undefined) params.set("is_published", String(options.isPublished));
    if (options?.search) params.set("search", options.search);
    if (options?.limit) params.set("limit", String(options.limit));
    if (options?.offset) params.set("offset", String(options.offset));

    const [listRes, countRes] = await Promise.all([
      fetch(`${GO_API_URL}/branches?${params.toString()}`, { cache: "no-store" }),
      fetch(`${GO_API_URL}/branches/count?${params.toString()}`, { cache: "no-store" }),
    ]);

    if (!listRes.ok) {
      return { data: [], total: 0, error: await extractErrorMessage(listRes, "Không thể tải danh sách chi nhánh") };
    }
    if (!countRes.ok) {
      return { data: [], total: 0, error: await extractErrorMessage(countRes, "Không thể đếm số lượng chi nhánh") };
    }

    const [rows, countData] = await Promise.all([
      listRes.json() as Promise<GoBranchResponse[] | null>,
      countRes.json() as Promise<{ count: number }>,
    ]);

    return {
      data: (rows ?? []).map(mapGoBranch),
      total: countData.count,
      error: null,
    };
  } catch (error) {
    if (isPrerenderError(error)) throw error;
    console.error("getBranchesWithCountAction error:", error);
    return { data: [], total: 0, error: "Không thể tải danh sách chi nhánh" };
  }
}

export async function getBranchBySlugAction(slug: string) {
  if (!GO_API_URL) {
    return { data: null, error: null };
  }
  try {
    const res = await fetch(`${GO_API_URL}/branches/slug/${slug}`, { cache: "no-store" });
    if (res.status === 404) {
      return { data: null, error: null };
    }
    if (!res.ok) {
      return { data: null, error: await extractErrorMessage(res, "Không thể tải thông tin chi nhánh") };
    }

    const row = (await res.json()) as GoBranchResponse;
    return { data: mapGoBranch(row), error: null };
  } catch (error) {
    if (isPrerenderError(error)) throw error;
    console.error("getBranchBySlugAction error:", error);
    return { data: null, error: "Không thể tải thông tin chi nhánh" };
  }
}

export async function createBranchAction(input: CreateBranchInput) {
  if (!GO_API_URL) {
    return { data: null, error: "GO_API_URL is not configured" };
  }
  try {
    const res = await fetch(`${GO_API_URL}/branches`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
      body: JSON.stringify(toSnakeCaseBody(input)),
    });
    if (!res.ok) {
      return { data: null, error: await extractErrorMessage(res, "Không thể tạo chi nhánh") };
    }

    const row = (await res.json()) as GoBranchResponse;
    revalidatePath("/admin/branches");
    revalidatePath("/co-so-ha-tang");
    revalidatePath("/thong-tin");
    revalidateTag("layout", { expire: 0 });
    await purgeCloudflareCache();
    return { data: mapGoBranch(row), error: null };
  } catch (error) {
    if (isPrerenderError(error)) throw error;
    console.error("createBranchAction error:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Không thể tạo chi nhánh",
    };
  }
}

export async function updateBranchAction(input: UpdateBranchInput) {
  if (!GO_API_URL) {
    return { data: null, error: "GO_API_URL is not configured" };
  }
  try {
    const { id, ...rest } = input;
    const res = await fetch(`${GO_API_URL}/branches/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
      body: JSON.stringify(toSnakeCaseBody(rest)),
    });
    if (!res.ok) {
      return { data: null, error: await extractErrorMessage(res, "Không thể cập nhật chi nhánh") };
    }

    const row = (await res.json()) as GoBranchResponse;
    revalidatePath("/admin/branches");
    revalidatePath("/co-so-ha-tang");
    revalidatePath("/thong-tin");
    revalidateTag("layout", { expire: 0 });
    await purgeCloudflareCache();
    return { data: mapGoBranch(row), error: null };
  } catch (error) {
    if (isPrerenderError(error)) throw error;
    console.error("updateBranchAction error:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Không thể cập nhật chi nhánh",
    };
  }
}

export async function deleteBranchAction(id: string) {
  if (!GO_API_URL) {
    return { success: false, error: "GO_API_URL is not configured" };
  }
  try {
    const res = await fetch(`${GO_API_URL}/branches/${id}`, { method: "DELETE", headers: await authHeaders() });
    if (!res.ok) {
      return { success: false, error: await extractErrorMessage(res, "Không thể xóa chi nhánh") };
    }

    revalidatePath("/admin/branches");
    revalidatePath("/co-so-ha-tang");
    revalidatePath("/thong-tin");
    revalidateTag("layout", { expire: 0 });
    await purgeCloudflareCache();
    return { success: true, error: null };
  } catch (error) {
    if (isPrerenderError(error)) throw error;
    console.error("deleteBranchAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Không thể xóa chi nhánh",
    };
  }
}

export async function updateBranchOrderAction(id: string, orderIndex: number) {
  if (!GO_API_URL) {
    return { success: false, error: "GO_API_URL is not configured" };
  }
  try {
    const res = await fetch(`${GO_API_URL}/branches/${id}/order`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
      body: JSON.stringify({ order_index: orderIndex }),
    });
    if (!res.ok) {
      return { success: false, error: await extractErrorMessage(res, "Không thể cập nhật thứ tự chi nhánh") };
    }

    revalidatePath("/admin/branches");
    revalidateTag("layout", { expire: 0 });
    await purgeCloudflareCache();
    return { success: true, error: null };
  } catch (error) {
    if (isPrerenderError(error)) throw error;
    console.error("updateBranchOrderAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Không thể cập nhật thứ tự chi nhánh",
    };
  }
}
