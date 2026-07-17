"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import {
  CreateProductInput,
  UpdateProductInput,
  ProductFilter,
  ProductWithRelations,
  Product,
  Json,
  PRODUCT_CONDITION,
  ProductCondition,
  VariantStockStatus,
  ProductOptionInput,
  ProductVariantInput,
  AttributeValueInput,
  AttributeDataType,
  CatalogPage,
  UpdateCatalogPageInput,
  createProductSchema,
  updateProductSchema,
} from "../domain";
import { authHeaders, toSnakeCaseBody } from "@/shared/lib/go-api";
import { submitToIndexNow } from "@/shared/lib/indexnow";
import { warmCache } from "@/shared/lib/cache-warm";
import { BASE_URL } from "@/shared/lib/seo-schema";
import type { ImageAsset } from "@/shared/lib/image-asset";

const GO_API_URL = process.env.GO_API_URL;

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

// --- v2: options/variants (see elc-go/docs/product-v2-design.md) ---

interface GoProductOptionValue {
  id: string;
  value: string;
  order_index: number;
}

interface GoProductOption {
  id: string;
  name: string;
  order_index: number;
  values: GoProductOptionValue[] | null;
}

interface GoVariantComponent {
  id: string;
  component_id: string;
  component_mpn: string;
  component_sku: string;
  quantity: number;
  role: string | null;
}

interface GoProductVariant {
  id: string;
  mpn: string;
  sku: string;
  gtin: string | null;
  is_default: boolean;
  is_standalone: boolean;
  stock_status: string;
  lead_time_days: number | null;
  original_price: number;
  sale_price: number | null;
  discount_percent: number;
  display_price: number;
  weight: number | null;
  is_active: boolean;
  order_index: number;
  option_value_ids: string[] | null;
  components: GoVariantComponent[] | null;
  created_at: string;
  updated_at: string;
}

interface GoAttributeValue {
  id: string;
  attribute_definition_id: string;
  code: string;
  name: string;
  group_label: string | null;
  data_type: string;
  unit: string | null;
  options: string[] | null;
  value_text: string | null;
  value_number: number | null;
  value_boolean: boolean | null;
  value_options: string[] | null;
}

interface GoProductResponse {
  id: string;
  category_id: string;
  brand_id: string;
  name: string;
  slug: string;
  description: Json;
  images: ImageAsset[] | null;
  labels: string[] | null;
  is_featured: boolean;
  is_published: boolean;
  order_index: number;
  condition: string;
  meta_title: string | null;
  meta_description: string | null;
  product_line_id: string | null;
  warranty_months: number | null;
  warranty_terms: string | null;
  default_variant_id: string | null;
  display_price: number | null;
  display_stock_status: string | null;
  price_min: number | null;
  price_max: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  category: GoCategoryRef | null;
  brand: GoBrandRef | null;
  tags: { id: string; name: string; slug: string }[] | null;
  options: GoProductOption[] | null;
  variants: GoProductVariant[] | null;
  attribute_values: GoAttributeValue[] | null;
}

interface GoProductListResponse {
  data: GoProductResponse[] | null;
  total_count: number;
}

interface GoErrorResponse {
  code: string;
  message: string;
  fields?: Record<string, string[]>;
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

function mapGoProduct(row: GoProductResponse): ProductWithRelations {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug || "",
    metaTitle: row.meta_title,
    metaDescription: row.meta_description,
    description: row.description ?? null,
    images: row.images || [],
    labels: row.labels || [],
    isFeatured: row.is_featured || false,
    isPublished: row.is_published || false,
    orderIndex: row.order_index || 0,
    categoryId: row.category_id || "",
    brandId: row.brand_id || "",
    condition: (row.condition as ProductCondition) || PRODUCT_CONDITION.NEW,
    productLineId: row.product_line_id ?? null,
    warrantyMonths: row.warranty_months ?? null,
    warrantyTerms: row.warranty_terms ?? null,
    defaultVariantId: row.default_variant_id ?? null,
    displayPrice: row.display_price ?? null,
    displayStockStatus: row.display_stock_status ?? null,
    priceMin: row.price_min ?? null,
    priceMax: row.price_max ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    options: (row.options ?? []).map((o) => ({
      id: o.id,
      name: o.name,
      orderIndex: o.order_index,
      values: (o.values ?? []).map((v) => ({ id: v.id, value: v.value, orderIndex: v.order_index })),
    })),
    variants: (row.variants ?? []).map((v) => ({
      id: v.id,
      mpn: v.mpn,
      sku: v.sku,
      gtin: v.gtin,
      isDefault: v.is_default,
      isStandalone: v.is_standalone,
      stockStatus: v.stock_status as VariantStockStatus,
      leadTimeDays: v.lead_time_days,
      originalPrice: v.original_price,
      salePrice: v.sale_price,
      discountPercent: v.discount_percent,
      displayPrice: v.display_price,
      weight: v.weight,
      isActive: v.is_active,
      orderIndex: v.order_index,
      optionValueIds: v.option_value_ids ?? [],
      components: (v.components ?? []).map((c) => ({
        id: c.id,
        componentId: c.component_id,
        componentMpn: c.component_mpn,
        componentSku: c.component_sku,
        quantity: c.quantity,
        role: c.role,
      })),
      createdAt: v.created_at,
      updatedAt: v.updated_at,
    })),
    attributeValues: (row.attribute_values ?? []).map((av) => ({
      id: av.id,
      attributeDefinitionId: av.attribute_definition_id,
      code: av.code,
      name: av.name,
      groupLabel: av.group_label,
      dataType: av.data_type as AttributeDataType,
      unit: av.unit,
      options: av.options ?? [],
      valueText: av.value_text,
      valueNumber: av.value_number,
      valueBoolean: av.value_boolean,
      valueOptions: av.value_options,
    })),
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
  if (filter.productLineId) params.set("product_line_id", filter.productLineId);
  if (filter.isFeatured !== undefined) params.set("is_featured", String(filter.isFeatured));
  if (filter.isPublished !== undefined) params.set("is_published", String(filter.isPublished));
  if (filter.limit !== undefined) params.set("limit", String(filter.limit));
  if (filter.offset !== undefined) params.set("offset", String(filter.offset));
  if (filter.includeDeleted !== undefined) params.set("include_deleted", String(filter.includeDeleted));

  return params;
}

export async function getProductsAction(filter?: ProductFilter) {
  if (!GO_API_URL) {
    return { data: [] as ProductWithRelations[], totalCount: 0, error: null };
  }
  try {
    const params = buildProductSearchParams(filter);
    const res = await fetch(`${GO_API_URL}/products?${params.toString()}`, { cache: "no-store" });
    if (!res.ok) {
      return {
        data: [] as ProductWithRelations[],
        totalCount: 0,
        error: await extractErrorMessage(res, "Không thể tải danh sách sản phẩm"),
      };
    }

    const body = (await res.json()) as GoProductListResponse;
    return {
      data: (body.data ?? []).map(mapGoProduct),
      totalCount: body.total_count || 0,
      error: null,
    };
  } catch (error) {
    if (isPrerenderError(error)) throw error;
    console.error("getProductsAction error:", error);
    return {
      data: [] as ProductWithRelations[],
      totalCount: 0,
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


// toSnakeCaseBody is shallow by design (see shared/lib/go-api.ts) — it does
// NOT recurse into nested arrays/objects, so options/variants (whose Go DTO
// field names differ from the camelCase TS ones, e.g. optionName →
// option_name, componentIndex → component_index) need explicit manual
// remapping here, same "manual remapping for nested payloads" convention
// this project already uses elsewhere (see elc-go migration conventions).
function toGoOptionsPayload(options: ProductOptionInput[] | undefined) {
  if (!options) return undefined;
  return options.map((o) => ({ name: o.name, values: o.values }));
}

function toGoVariantsPayload(variants: ProductVariantInput[] | undefined) {
  if (!variants) return undefined;
  return variants.map((v) => ({
    mpn: v.mpn,
    sku: v.sku || undefined,
    gtin: v.gtin || undefined,
    is_default: v.isDefault ?? false,
    is_component_only: v.isComponentOnly ?? false,
    stock_status: v.stockStatus,
    lead_time_days: v.leadTimeDays ?? undefined,
    cost_price: undefined, // never entered/edited in this UI — internal-only field
    original_price: v.originalPrice,
    sale_price: v.salePrice ?? undefined,
    discount_percent: v.discountPercent ?? 0,
    weight: v.weight ?? undefined,
    is_active: v.isActive ?? true,
    order_index: v.orderIndex ?? 0,
    option_selections: (v.optionSelections ?? []).map((s) => ({
      option_name: s.optionName,
      value: s.value,
    })),
    components: (v.components ?? []).map((c) => ({
      component_index: c.componentIndex,
      quantity: c.quantity,
      role: c.role || undefined,
    })),
  }));
}

function toGoAttributeValuesPayload(values: AttributeValueInput[] | undefined) {
  if (!values) return undefined;
  return values.map((v) => ({
    attribute_definition_id: v.attributeDefinitionId,
    value_text: v.valueText ?? undefined,
    value_number: v.valueNumber ?? undefined,
    value_boolean: v.valueBoolean ?? undefined,
    value_options: v.valueOptions ?? undefined,
  }));
}

export async function createProductAction(input: CreateProductInput) {
  if (!GO_API_URL) {
    return { data: null, error: "GO_API_URL is not configured" };
  }
  try {
    const validated = createProductSchema.parse(input);
    const { options, variants, attributeValues, ...rest } = validated;
    const body = {
      ...toSnakeCaseBody(rest),
      options: toGoOptionsPayload(options),
      variants: toGoVariantsPayload(variants),
      attribute_values: toGoAttributeValuesPayload(attributeValues),
    };

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
    const { id, options, variants, attributeValues, ...rest } = validated;
    const body = {
      ...toSnakeCaseBody(rest),
      options: toGoOptionsPayload(options),
      variants: toGoVariantsPayload(variants),
      attribute_values: toGoAttributeValuesPayload(attributeValues),
    };

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

interface GoCatalogPageResponse {
  content: Json | null;
  meta_title: string | null;
  meta_description: string | null;
  updated_at: string;
}

function mapGoCatalogPage(row: GoCatalogPageResponse): CatalogPage {
  return {
    content: row.content,
    metaTitle: row.meta_title,
    metaDescription: row.meta_description,
    updatedAt: row.updated_at,
  };
}

export async function getCatalogPageAction() {
  if (!GO_API_URL) {
    return { data: null as CatalogPage | null, error: null };
  }
  try {
    const res = await fetch(`${GO_API_URL}/catalog-page`, { cache: "no-store" });
    if (!res.ok) {
      return { data: null, error: await extractErrorMessage(res, "Không thể tải cấu hình trang sản phẩm") };
    }
    const row = (await res.json()) as GoCatalogPageResponse;
    return { data: mapGoCatalogPage(row), error: null };
  } catch (error) {
    console.error("getCatalogPageAction error:", error);
    return { data: null, error: "Không thể tải cấu hình trang sản phẩm" };
  }
}

export async function updateCatalogPageAction(input: UpdateCatalogPageInput) {
  if (!GO_API_URL) {
    return { data: null, error: "GO_API_URL is not configured" };
  }
  try {
    const res = await fetch(`${GO_API_URL}/catalog-page`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
      body: JSON.stringify({
        content: input.content ?? null,
        meta_title: input.metaTitle ?? null,
        meta_description: input.metaDescription ?? null,
      }),
    });
    if (!res.ok) {
      return { data: null, error: await extractErrorMessage(res, "Không thể cập nhật cấu hình trang sản phẩm") };
    }
    const row = (await res.json()) as GoCatalogPageResponse;
    revalidatePath("/admin/catalog-page");
    revalidatePath("/san-pham");
    return { data: mapGoCatalogPage(row), error: null };
  } catch (error) {
    console.error("updateCatalogPageAction error:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Không thể cập nhật cấu hình trang sản phẩm",
    };
  }
}

