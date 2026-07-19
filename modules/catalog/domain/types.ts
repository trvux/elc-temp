
import { Brand, CreateBrandInput, UpdateBrandInput } from "../../brand/domain";
export type { Brand, CreateBrandInput, UpdateBrandInput };
import type { AttributeDataType } from "../../attribute-definition/domain";
export type { AttributeDataType };
import { ProductStatus, VariantStockStatus } from "./constants";
import type { ImageAsset } from "@/shared/lib/image-asset";
export type { ImageAsset };

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

// Product is a pure container — matching Shopify/Medusa's model, it carries
// NO sku/mpn/gtin/price/stock of its own. Every sellable identity lives on
// ProductVariant; a product always has >=1 variant (the Go backend rejects
// a create/update that would leave it with zero — see
// elc-go/internal/product/application/create_product.go's
// resolveDefaultVariant), so displayPrice/displayStockStatus are always
// populated in practice. See elc-go/docs/product-v2-design.md.
export interface Product {
    id: string;
    name: string;
    slug: string;
    metaTitle?: string | null;
    metaDescription?: string | null;
    description: Json;
    // Short plain-text blurb — distinct from `description` (the rich-text
    // body). Used for listing cards/snippets. See elc-go's
    // Product.ShortDescription.
    shortDescription?: string | null;
    images: ImageAsset[];
    isFeatured: boolean;
    // status only ever moves through the dedicated submit/approve/reject/
    // archive actions (see presentation/actions.ts) — never sent as part of
    // create/update payloads. rejectionReason is set when an owner/admin
    // sends a proposed product back to draft.
    status: ProductStatus;
    rejectionReason?: string | null;
    orderIndex: number;
    categoryId: string;
    brandId: string;
    productLineId?: string | null;
    // Denormalized read cache computed from the variant tree — see
    // elc-go/docs/product-v2-design.md.
    defaultVariantId?: string | null;
    displayPrice?: number | null;
    displayStockStatus?: string | null;
    priceMin?: number | null;
    priceMax?: number | null;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
}

// --- v2: variants/options/bundle components/product lines ---
// Mirrors elc-go's product v2 model 1:1 (see elc-go/docs/product-v2-design.md).

export interface ProductOptionValue {
    id: string;
    value: string;
    orderIndex: number;
}

export interface ProductOption {
    id: string;
    name: string;
    orderIndex: number;
    values: ProductOptionValue[];
}

export interface VariantComponent {
    id: string;
    componentId: string;
    componentMpn: string;
    componentSku: string;
    quantity: number;
    role?: string | null;
}

// AttributeValue is the read-shape of one structured spec value — replaces
// the old free-text specs label/value entry. Denormalized with the
// attribute definition's display fields (name/unit/dataType/options/group)
// so the PDP/admin form don't need a second lookup. See
// modules/attribute-definition/domain/types.ts and
// elc-go/internal/product/domain/attribute_value.go.
export interface AttributeValue {
    id: string;
    attributeDefinitionId: string;
    code: string;
    name: string;
    groupLabel?: string | null;
    dataType: AttributeDataType;
    unit?: string | null;
    options: string[];
    valueText?: string | null;
    valueNumber?: number | null;
    valueBoolean?: boolean | null;
    // Only meaningful for dataType = "multiselect" — 0..N of the attribute
    // definition's `options`, not a single scalar like the other types.
    valueOptions?: string[] | null;
}

export interface AttributeValueInput {
    attributeDefinitionId: string;
    valueText?: string | null;
    valueNumber?: number | null;
    valueBoolean?: boolean | null;
    valueOptions?: string[] | null;
}

// No costPrice — the Go API never returns it (internal margin data, never
// exposed), so it has no place in this client-facing type either.
export interface ProductVariant {
    id: string;
    mpn: string;
    sku: string;
    gtin?: string | null;
    isDefault: boolean;
    isStandalone: boolean;
    stockStatus: VariantStockStatus;
    leadTimeDays?: number | null;
    originalPrice: number;
    salePrice?: number | null;
    discountPercent: number;
    displayPrice: number;
    weight?: number | null;
    isActive: boolean;
    orderIndex: number;
    optionValueIds: string[];
    components: VariantComponent[];
    createdAt: string;
    updatedAt: string;
}

export interface ProductWithRelations extends Product {
    category?: {
        id: string;
        name: string;
        slug: string;
        metaTitle?: string | null;
        metaDescription?: string | null;
    } | null;
    brand?: Brand | null;
    tags?: { id: string; name: string; slug: string }[];
    options?: ProductOption[];
    variants?: ProductVariant[];
    // Only ever populated on single-product reads (GetByID/GetBySlug) — see
    // elc-go's ProductRepository doc comment. Never present on list results.
    attributeValues?: AttributeValue[];
}

// Transient create/update input shapes for the variant tree — distinct from
// the persisted ProductOption/ProductVariant read types above. Variant
// option selections/bundle components reference sibling options/variants by
// name/index rather than ID (those IDs don't exist yet within one request)
// — mirrors elc-go's domain.ProductOptionInput/ProductVariantInput exactly.
export interface ProductOptionInput {
    name: string;
    values: string[];
}

export interface VariantOptionSelectionInput {
    optionName: string;
    value: string;
}

export interface VariantComponentInput {
    componentIndex: number;
    quantity: number;
    role?: string | null;
}

export interface ProductVariantInput {
    mpn: string;
    sku?: string;
    gtin?: string | null;
    isDefault?: boolean;
    isComponentOnly?: boolean;
    stockStatus?: VariantStockStatus;
    leadTimeDays?: number | null;
    originalPrice: number;
    salePrice?: number | null;
    discountPercent?: number;
    weight?: number | null;
    isActive?: boolean;
    orderIndex?: number;
    optionSelections?: VariantOptionSelectionInput[];
    components?: VariantComponentInput[];
}

// CreateProductInput/UpdateProductInput deliberately carry no status field —
// a created product always starts as draft, and status only ever advances
// through the dedicated submit/approve/reject/archive actions.
export interface CreateProductInput {
    name: string;
    slug: string;
    metaTitle?: string | null;
    metaDescription?: string | null;
    description?: Json;
    shortDescription?: string | null;
    images?: ImageAsset[];
    isFeatured?: boolean;
    orderIndex?: number;
    categoryId: string;
    brandId: string;
    tagIds?: string[];
    productLineId?: string | null;
    options?: ProductOptionInput[];
    // Must contain at least one entry — the Go backend rejects an empty
    // list, since Product itself carries no price/sku (see the Product doc
    // comment above).
    variants: ProductVariantInput[];
    attributeValues?: AttributeValueInput[];
}

export interface UpdateProductInput extends Partial<CreateProductInput> {
    id: string;
}

export type ProductSortBy = "price_asc" | "price_desc" | "newest";

// ProductFilter: list scoping (pagination + basic ID/flag matching) plus
// search/price-range/attribute-facet dimensions, rebuilt on top of the
// structured attribute system — see elc-go's domain.ProductFilter doc
// comment for the full rationale.
export interface ProductFilter {
    categoryId?: string;
    categoryIds?: string[];
    brandId?: string;
    brandIds?: string[];
    productLineId?: string;
    isFeatured?: boolean;
    status?: ProductStatus;
    limit?: number;
    offset?: number;
    includeDeleted?: boolean;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: ProductSortBy;
    // attributeTokens: attribute code -> selected option values (OR within
    // a code, AND across codes) — for select/multiselect/boolean facets.
    attributeTokens?: Record<string, string[]>;
    // attributeRanges: attribute code -> [min, max] (either may be
    // undefined) — for number-type facets.
    attributeRanges?: Record<string, [number | undefined, number | undefined]>;
}

export interface BrandFacet {
    id: string;
    name: string;
    slug: string;
    logoUrl: string;
    count: number;
}

// NumberBucket is one suggested range for a number-type facet (price or a
// number attribute) — min === max means an exact value (few enough distinct
// values that showing the real number is more honest than a range).
export interface NumberBucket {
    min: number;
    max: number;
    count: number;
}

export interface PriceFacet {
    min: number;
    max: number;
    buckets: NumberBucket[];
}

export interface AttributeFacetOption {
    value: string;
    count: number;
}

export interface AttributeFacet {
    code: string;
    name: string;
    groupLabel?: string | null;
    dataType: AttributeDataType;
    unit?: string | null;
    options: AttributeFacetOption[];
    min?: number | null;
    max?: number | null;
    buckets?: NumberBucket[];
}

export interface ProductFacets {
    brands: BrandFacet[];
    price: PriceFacet;
    attributes: AttributeFacet[];
}

// CatalogPage is the singleton content/SEO config for "Tất cả sản phẩm" (the
// catch-all/root product listing) — it lives in Product's own bounded
// context (not modules/system-page, an unrelated set of pages), since
// there's exactly one such page. No id/create/delete — only get/update.
export interface CatalogPage {
    content: Json | null;
    metaTitle?: string | null;
    metaDescription?: string | null;
    updatedAt: string;
}

export interface UpdateCatalogPageInput {
    content?: Json | null;
    metaTitle?: string | null;
    metaDescription?: string | null;
}
