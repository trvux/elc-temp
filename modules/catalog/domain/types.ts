
export * from "../../brand/domain";
import { StockStatus } from "./constants";

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

export interface Product {
    id: string;
    name: string;
    slug: string;
    sku: string;
    shortDescription?: string;
    metaTitle?: string | null;
    metaDescription?: string | null;
    description: Json;
    specs: Json;
    originalPrice: number;
    salePrice: number;
    discountPercent: number;
    images: string[];
    isFeatured: boolean;
    isPublished: boolean;
    orderIndex: number;
    categoryId: string;
    brandId: string;
    stockStatus: StockStatus;
    mpn?: string | null;
    gtin?: string | null;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
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
}

export interface CreateProductInput {
    name: string;
    slug: string;
    sku: string;
    shortDescription?: string;
    metaTitle?: string | null;
    metaDescription?: string | null;
    description?: Json;
    specs?: Json;
    originalPrice: number;
    salePrice?: number;
    images?: string[];
    isFeatured?: boolean;
    isPublished?: boolean;
    orderIndex?: number;
    categoryId: string;
    brandId: string;
    stockStatus?: StockStatus;
    mpn?: string | null;
    gtin?: string | null;
}

export interface UpdateProductInput extends Partial<CreateProductInput> {
    id: string;
}

export type ProductSortBy =
    | "price_asc"
    | "price_desc"
    | "newest"
    | "popularity"
    | "discount_desc";

export interface ProductFilter {
    categoryId?: string;
    categoryIds?: string[];
    brandId?: string;
    brandIds?: string[];
    brandSlugs?: string[];
    isFeatured?: boolean;
    isPublished?: boolean;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: ProductSortBy;
    specs?: Record<string, string[]>;
    limit?: number;
    offset?: number;
    includeDeleted?: boolean;
}
