"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import {
  CreateProductInput,
  UpdateProductInput,
  ProductFilter,
  ProductWithRelations,
  Product,
  Json,
  STOCK_STATUS,
  StockStatus,
  PRODUCT_CONDITION,
  ProductCondition,
  createProductSchema,
  updateProductSchema,
  normalizeProductPrice,
} from "../domain";
import { authHeaders, toSnakeCaseBody } from "@/shared/lib/go-api";
import { submitToIndexNow } from "@/shared/lib/indexnow";
import { warmCache } from "@/shared/lib/cache-warm";
import { purgeCloudflareCache } from "@/shared/lib/cloudflare-purge";
import { BASE_URL } from "@/shared/lib/seo-schema";
import type { ImageAsset } from "@/shared/lib/image-asset";

const GO_API_URL = process.env.GO_API_URL;

interface GoSpecSubItem {
  label: string;
  value: string;
  unit?: string;
}

interface GoSpecItem {
  label: string;
  value?: string;
  unit?: string;
  items?: GoSpecSubItem[];
}

interface GoCategoryRef {
  id: string;
  name: string;
  slug: string;
  meta_title: string | null;
  meta_description: string | null;
}

interface GoBrandRef {
  id: string;
  name: string;
  slug: string;
  logo_url: string;
  meta_title: string | null;
  meta_description: string | null;
  is_featured: boolean;
  order_index: number;
}

interface GoSeo {
  title?: string;
  description?: string;
  noindex?: boolean;
}

interface GoProductResponse {
  id: string;
  category_id: string;
  brand_id: string;
  name: string;
  sku: string;
  slug: string;
  description: Json;
  specs: GoSpecItem[] | null;
  images: ImageAsset[] | null;
  labels: string[] | null;
  original_price: number;
  sale_price: number | null;
  discount_percent: number;
  is_featured: boolean;
  is_published: boolean;
  order_index: number;
  stock_status: string;
  condition: string;
  meta_title: string | null;
  meta_description: string | null;
  seo: GoSeo;
  mpn: string | null;
  gtin: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  category: GoCategoryRef | null;
  brand: GoBrandRef | null;
  tags: { id: string; name: string; slug: string }[] | null;
}

interface GoFacetsResponse {
  brands: { id: string; name: string; slug: string }[];
  specs: { label: string; values: string[] }[];
  min_price: number;
  max_price: number;
}

interface GoProductListResponse {
  data: GoProductResponse[] | null;
  total_count: number;
  facets: GoFacetsResponse;
}

interface GoErrorResponse {
  code: string;
  message: string;
  fields?: Record<string, string[]>;
}

interface GoAdjacentProductResponse {
  name: string;
  slug: string;
}

interface GoAdjacentProductsResponse {
  prev: GoAdjacentProductResponse | null;
  next: GoAdjacentProductResponse | null;
}

const EMPTY_FACETS = {
  brands: [] as { id: string; name: string; slug: string }[],
  specs: [] as { label: string; values: string[] }[],
  minPrice: 0,
  maxPrice: 0,
};

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

function mapGoProduct(row: GoProductResponse): ProductWithRelations {
  const { originalPrice, salePrice, discountPercent } = normalizeProductPrice(
    row.original_price,
    row.sale_price,
    row.discount_percent,
  );

  return {
    id: row.id,
    name: row.name,
    slug: row.slug || "",
    sku: row.sku,
    shortDescription: row.meta_description ?? "",
    metaTitle: row.meta_title,
    metaDescription: row.meta_description,
    seo: row.seo,
    description: row.description ?? null,
    specs: (row.specs ?? null) as unknown as Json,
    originalPrice,
    salePrice,
    discountPercent,
    images: row.images || [],
    labels: row.labels || [],
    isFeatured: row.is_featured || false,
    isPublished: row.is_published || false,
    orderIndex: row.order_index || 0,
    categoryId: row.category_id || "",
    brandId: row.brand_id || "",
    stockStatus: (row.stock_status as StockStatus) || STOCK_STATUS.IN_STOCK,
    condition: (row.condition as ProductCondition) || PRODUCT_CONDITION.NEW,
    mpn: row.mpn ?? null,
    gtin: row.gtin ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    category: row.category
      ? {
          id: row.category.id,
          name: row.category.name,
          slug: row.category.slug || "",
          metaTitle: row.category.meta_title,
          metaDescription: row.category.meta_description,
        }
      : null,
    brand: row.brand
      ? {
          id: row.brand.id,
          name: row.brand.name,
          slug: row.brand.slug,
          logoUrl: row.brand.logo_url || "",
          metaTitle: row.brand.meta_title,
          metaDescription: row.brand.meta_description,
          isFeatured: row.brand.is_featured || false,
          orderIndex: row.brand.order_index || 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          deletedAt: null,
        }
      : null,
    tags: row.tags ?? [],
  };
}

function mapGoProductPlain(row: GoProductResponse): Product {
  // Create/Update never join relations — this is still a ProductWithRelations
  // structurally (category/brand simply come back null), which is a valid Product.
  return mapGoProduct(row);
}

function buildProductSearchParams(filter?: ProductFilter): URLSearchParams {
  const params = new URLSearchParams();
  if (!filter) return params;

  if (filter.categoryId) params.set("category_id", filter.categoryId);
  if (filter.categoryIds && filter.categoryIds.length > 0) {
    params.set("category_ids", filter.categoryIds.join(","));
  }
  if (filter.brandId) params.set("brand_id", filter.brandId);
  if (filter.brandIds && filter.brandIds.length > 0) {
    params.set("brand_ids", filter.brandIds.join(","));
  }
  if (filter.brandSlugs && filter.brandSlugs.length > 0) {
    params.set("brand_slugs", filter.brandSlugs.join(","));
  }
  if (filter.isFeatured !== undefined) params.set("is_featured", String(filter.isFeatured));
  if (filter.isPublished !== undefined) params.set("is_published", String(filter.isPublished));
  if (filter.search) params.set("search", filter.search);
  if (filter.minPrice !== undefined) params.set("min_price", String(Math.round(filter.minPrice)));
  if (filter.maxPrice !== undefined) params.set("max_price", String(Math.round(filter.maxPrice)));
  if (filter.sortBy) params.set("sort_by", filter.sortBy);
  if (filter.condition) params.set("condition", filter.condition);
  if (filter.specs) {
    Object.entries(filter.specs).forEach(([label, values]) => {
      if (!values || values.length === 0) return;
      values.forEach((value) => params.append(`spec_${label}`, value));
    });
  }
  if (filter.limit !== undefined) params.set("limit", String(filter.limit));
  if (filter.offset !== undefined) params.set("offset", String(filter.offset));
  if (filter.includeDeleted !== undefined) params.set("include_deleted", String(filter.includeDeleted));

  return params;
}

export async function getProductsAction(filter?: ProductFilter) {
  if (!GO_API_URL) {
    return { data: [] as ProductWithRelations[], totalCount: 0, facets: EMPTY_FACETS, error: null };
  }
  try {
    const params = buildProductSearchParams(filter);
    const res = await fetch(`${GO_API_URL}/products?${params.toString()}`, { cache: "no-store" });
    if (!res.ok) {
      return {
        data: [] as ProductWithRelations[],
        totalCount: 0,
        facets: EMPTY_FACETS,
        error: await extractErrorMessage(res, "Không thể tải danh sách sản phẩm"),
      };
    }

    const body = (await res.json()) as GoProductListResponse;
    return {
      data: (body.data ?? []).map(mapGoProduct),
      totalCount: body.total_count || 0,
      facets: {
        brands: body.facets?.brands ?? [],
        specs: body.facets?.specs ?? [],
        minPrice: body.facets?.min_price ?? 0,
        maxPrice: body.facets?.max_price ?? 0,
      },
      error: null,
    };
  } catch (error) {
    if (isPrerenderError(error)) throw error;
    console.error("getProductsAction error:", error);
    return {
      data: [] as ProductWithRelations[],
      totalCount: 0,
      facets: EMPTY_FACETS,
      error: "Không thể tải danh sách sản phẩm",
    };
  }
}

export async function getProductBySlugAction(slug: string) {
  if (!GO_API_URL) {
    return { data: null, error: null };
  }
  try {
    const res = await fetch(`${GO_API_URL}/products/slug/${encodeURIComponent(slug)}`, { cache: "no-store" });
    if (res.status === 404) {
      return { data: null, error: null };
    }
    if (!res.ok) {
      return { data: null, error: await extractErrorMessage(res, "Không thể tải thông tin sản phẩm") };
    }

    const row = (await res.json()) as GoProductResponse;
    return { data: mapGoProduct(row), error: null };
  } catch (error) {
    if (isPrerenderError(error)) throw error;
    console.error("getProductBySlugAction error:", error);
    return { data: null, error: "Không thể tải thông tin sản phẩm" };
  }
}

export async function getProductByIdAction(id: string) {
  if (!GO_API_URL) {
    return { data: null, error: null };
  }
  try {
    const res = await fetch(`${GO_API_URL}/products/${id}`, { cache: "no-store" });
    if (res.status === 404) {
      return { data: null, error: null };
    }
    if (!res.ok) {
      return { data: null, error: await extractErrorMessage(res, "Không thể tải thông tin sản phẩm") };
    }

    const row = (await res.json()) as GoProductResponse;
    return { data: mapGoProduct(row), error: null };
  } catch (error) {
    if (isPrerenderError(error)) throw error;
    console.error("getProductByIdAction error:", error);
    return { data: null, error: "Không thể tải thông tin sản phẩm" };
  }
}

export async function getProductsByIdsAction(ids: string[]) {
  if (!GO_API_URL || ids.length === 0) {
    return { data: [] as ProductWithRelations[], error: null };
  }
  try {
    const res = await fetch(`${GO_API_URL}/products/by-ids`, {
      // Public read-only route (batch fetch by ID) — no auth header needed.
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
      cache: "no-store",
    });
    if (!res.ok) {
      return { data: [], error: await extractErrorMessage(res, "Không thể tải danh sách sản phẩm") };
    }

    const rows = (await res.json()) as GoProductResponse[] | null;
    return { data: (rows ?? []).map(mapGoProduct), error: null };
  } catch (error) {
    if (isPrerenderError(error)) throw error;
    console.error("getProductsByIdsAction error:", error);
    return { data: [], error: "Không thể tải danh sách sản phẩm" };
  }
}

export async function getAdjacentProductsAction(id: string) {
  const empty = { prev: null, next: null } as { prev: GoAdjacentProductResponse | null; next: GoAdjacentProductResponse | null };
  if (!GO_API_URL) return empty;
  try {
    const res = await fetch(`${GO_API_URL}/products/${id}/adjacent`, { cache: "no-store" });
    if (!res.ok) return empty;

    const body = (await res.json()) as GoAdjacentProductsResponse;
    return { prev: body.prev ?? null, next: body.next ?? null };
  } catch (error) {
    if (isPrerenderError(error)) throw error;
    console.error("getAdjacentProductsAction error:", error);
    return empty;
  }
}

export async function createProductAction(input: CreateProductInput) {
  if (!GO_API_URL) {
    return { data: null, error: "GO_API_URL is not configured" };
  }
  try {
    const validated = createProductSchema.parse(input);
    const { shortDescription, metaDescription, ...rest } = validated;
    const body = toSnakeCaseBody({
      ...rest,
      metaDescription: metaDescription || shortDescription || undefined,
    });

    const res = await fetch(`${GO_API_URL}/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      return { data: null, error: await extractErrorMessage(res, "Không thể tạo sản phẩm") };
    }

    const row = (await res.json()) as GoProductResponse;
    const data = mapGoProductPlain(row);

    revalidatePath("/admin/products");
    revalidatePath("/san-pham", "layout");
    revalidatePath("/", "layout");
    revalidateTag("products-list", { expire: 0 });
    await purgeCloudflareCache();
    if (data?.slug) {
      revalidateTag(`slug:${data.slug}`, { expire: 0 });
    }
    if (data?.isPublished && data?.slug) {
      const url = `${BASE_URL}/san-pham/${data.slug}`;
      submitToIndexNow([url]).catch((err) => console.error("IndexNow product create error:", err));
      warmCache([url]);
    }
    return { data, error: null };
  } catch (error) {
    if (isPrerenderError(error)) throw error;
    console.error("createProductAction error:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to create product",
    };
  }
}

export async function updateProductAction(input: UpdateProductInput) {
  if (!GO_API_URL) {
    return { data: null, error: "GO_API_URL is not configured" };
  }
  try {
    const validated = updateProductSchema.parse(input);
    const { id, shortDescription, metaDescription, ...rest } = validated;
    const body = toSnakeCaseBody({
      ...rest,
      metaDescription: metaDescription || shortDescription || undefined,
    });

    const res = await fetch(`${GO_API_URL}/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      return { data: null, error: await extractErrorMessage(res, "Không thể cập nhật sản phẩm") };
    }

    const row = (await res.json()) as GoProductResponse;
    const data = mapGoProductPlain(row);

    revalidatePath("/admin/products");
    revalidatePath("/san-pham", "layout");
    revalidatePath("/", "layout");
    revalidateTag("products-list", { expire: 0 });
    await purgeCloudflareCache();
    if (data?.slug) {
      revalidateTag(`slug:${data.slug}`, { expire: 0 });
    }
    if (data?.isPublished && data?.slug) {
      const url = `${BASE_URL}/san-pham/${data.slug}`;
      submitToIndexNow([url]).catch((err) => console.error("IndexNow product update error:", err));
      warmCache([url]);
    }
    return { data, error: null };
  } catch (error) {
    if (isPrerenderError(error)) throw error;
    console.error("updateProductAction error:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to update product",
    };
  }
}

export async function deleteProductAction(id: string) {
  if (!GO_API_URL) {
    return { data: null, error: "GO_API_URL is not configured" };
  }
  try {
    const { data: product } = await getProductByIdAction(id);

    const res = await fetch(`${GO_API_URL}/products/${id}`, { method: "DELETE", headers: await authHeaders() });
    if (!res.ok) {
      return { data: null, error: await extractErrorMessage(res, "Không thể xóa sản phẩm") };
    }

    revalidatePath("/admin/products");
    revalidatePath("/san-pham", "layout");
    revalidatePath("/", "layout");
    revalidateTag("products-list", { expire: 0 });
    await purgeCloudflareCache();
    if (product?.slug) {
      revalidateTag(`slug:${product.slug}`, { expire: 0 });
    }
    return { data: true, error: null };
  } catch (error) {
    if (isPrerenderError(error)) throw error;
    console.error("deleteProductAction error:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to delete product",
    };
  }
}

