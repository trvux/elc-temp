
import { Brand, CreateBrandInput, UpdateBrandInput } from "../../brand/domain";
export type { Brand, CreateBrandInput, UpdateBrandInput };
import type { AttributeDataType } from "../../attribute-definition/domain";
export type { AttributeDataType };
import { ProductCondition, VariantStockStatus } from "./constants";
import type { Seo } from "@/shared/lib/seo-schema";
export type { Seo };
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
    seo?: Seo;
    description: Json;
    specs: Json;
    images: ImageAsset[];
    labels: string[];
    isFeatured: boolean;
    isPublished: boolean;
    orderIndex: number;
    categoryId: string;
    brandId: string;
    condition: ProductCondition;
    productLineId?: string | null;
    warrantyMonths?: number | null;
    warrantyTerms?: string | null;
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
}

export interface AttributeValueInput {
    attributeDefinitionId: string;
    valueText?: string | null;
    valueNumber?: number | null;
    valueBoolean?: boolean | null;
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

export interface CreateProductInput {
    name: string;
    slug: string;
    metaTitle?: string | null;
    metaDescription?: string | null;
    seo?: Seo;
    description?: Json;
    specs?: Json;
    images?: ImageAsset[];
    labels?: string[];
    isFeatured?: boolean;
    isPublished?: boolean;
    orderIndex?: number;
    categoryId: string;
    brandId: string;
    condition?: ProductCondition;
    tagIds?: string[];
    productLineId?: string | null;
    warrantyMonths?: number | null;
    warrantyTerms?: string | null;
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

// ProductFilter is bare list scoping (pagination + basic ID/flag matching) —
// no search/price-range/spec-facet/sort fields; those belonged to the
// removed facet/search system and will return, if at all, as part of the
// upcoming attribute-set redesign.
export interface ProductFilter {
    categoryId?: string;
    categoryIds?: string[];
    brandId?: string;
    brandIds?: string[];
    productLineId?: string;
    isFeatured?: boolean;
    isPublished?: boolean;
    limit?: number;
    offset?: number;
    includeDeleted?: boolean;
}

export type SpecSubItem = {
  label: string;
  value: string;
  unit?: string;
};

export type SpecItem = {
  label: string;
  value?: string;
  unit?: string;
  items?: SpecSubItem[];
};
