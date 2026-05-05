
import { Brand, CreateBrandInput, UpdateBrandInput } from "../../brand";
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
    shortDescription: string;
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
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
}

export interface ProductWithRelations extends Product {
    category?: { id: string; name: string; slug: string } | null;
    brand?: Brand | null;
}

export interface CreateProductInput {
    name: string;
    slug: string;
    sku: string;
    shortDescription?: string;
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
}

export interface UpdateProductInput extends Partial<CreateProductInput> {
    id: string;
}

export interface ProductFilter {
    categoryId?: string;
    categoryIds?: string[];
    brandId?: string;
    isFeatured?: boolean;
    isPublished?: boolean;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    limit?: number;
    offset?: number;
    includeDeleted?: boolean;
}
