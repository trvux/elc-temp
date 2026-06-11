import { createClient } from "@/shared/lib/supabase/server";
import { Tables, Insert, Update } from "@/shared/types/supabase";
import {
    CreateProductInput,
    Product,
    ProductWithRelations,
    UpdateProductInput,
    ProductRepository,
    ProductFilter,
    STOCK_STATUS,
    StockStatus,
    ProductCondition,
    normalizeProductPrice
} from "../domain";

type ProductRow = Tables<"products">;
type ProductInsert = Insert<"products">;
type ProductUpdate = Update<"products">;
type ProductRowWithRelations = ProductRow & {
    category: { id: string; name: string; slug: string; meta_title: string | null; meta_description: string | null } | null;
    brand: Tables<"brands"> | null;
};

export class SupabaseProductRepository implements ProductRepository {
    private readonly TABLE_NAME = "products";

    async getAll(options?: ProductFilter): Promise<ProductWithRelations[]> {
        const supabase = await createClient();
        let query = supabase
            .from(this.TABLE_NAME)
            .select(`
        *,
        category:categories(id, name, slug, meta_title, meta_description),
        brand:brands(*)
      `);

        query = this.applyFilters(query, options);

        if (options?.sortBy) {
            switch (options.sortBy) {
                case "price_asc":
                    query = query.order("sale_price", { ascending: true, nullsFirst: false });
                    break;
                case "price_desc":
                    query = query.order("sale_price", { ascending: false, nullsFirst: false });
                    break;
                case "newest":
                    query = query.order("created_at", { ascending: false });
                    break;
                case "popularity":
                    query = query.order("is_featured", { ascending: false }).order("order_index", { ascending: true });
                    break;
                case "discount_desc":
                    query = query.order("discount_percent", { ascending: false });
                    break;
                default:
                    query = query.order("order_index", { ascending: true });
            }
        } else {
            query = query.order("order_index", { ascending: true });
        }

        if (options?.limit) {
            const from = options.offset || 0;
            const to = from + options.limit - 1;
            query = query.range(from, to);
        }

        const { data, error } = await query;

        if (error) this.handleError(error, "getAll");

        return (data || []).map((row) => this.mapToDomainWithRelations(row as unknown as ProductRowWithRelations));
    }

    async count(options?: ProductFilter): Promise<number> {
        const supabase = await createClient();
        let query = supabase.from(this.TABLE_NAME).select("*", { count: "exact", head: true });

        query = this.applyFilters(query, options);

        const { count, error } = await query;
        if (error) this.handleError(error, "count");

        return count || 0;
    }

    async getById(id: string): Promise<ProductWithRelations | null> {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from(this.TABLE_NAME)
            .select(`
        *,
        category:categories(id, name, slug, meta_title, meta_description),
        brand:brands(*)
      `)
            .eq("id", id)
            .maybeSingle();

        if (error) this.handleError(error, "getById");
        return data ? this.mapToDomainWithRelations(data as unknown as ProductRowWithRelations) : null;
    }

    async getBySlug(slug: string): Promise<ProductWithRelations | null> {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from(this.TABLE_NAME)
            .select(`
        *,
        category:categories(id, name, slug, meta_title, meta_description),
        brand:brands(*)
      `)
            .eq("slug", slug)
            .maybeSingle();

        if (error) this.handleError(error, "getBySlug");
        return data ? this.mapToDomainWithRelations(data as unknown as ProductRowWithRelations) : null;
    }

    async create(input: CreateProductInput): Promise<Product> {
        const supabase = await createClient();
        const row: ProductInsert = {
            name: input.name,
            slug: input.slug,
            sku: input.sku,
            meta_title: input.metaTitle,
            meta_description: input.metaDescription || input.shortDescription,
            description: input.description,
            specs: input.specs,
            original_price: input.originalPrice,
            sale_price: input.salePrice,
            images: input.images,
            labels: input.labels,
            is_featured: input.isFeatured,
            is_published: input.isPublished,
            order_index: input.orderIndex,
            category_id: input.categoryId,
            brand_id: input.brandId,
            stock_status: input.stockStatus || STOCK_STATUS.IN_STOCK,
            condition: input.condition || "new",
            mpn: input.mpn,
            gtin: input.gtin,
        } as unknown as ProductInsert;

        const { data, error } = await supabase
            .from(this.TABLE_NAME)
            .insert(row)
            .select()
            .single();

        if (error) this.handleError(error, "create");

        return this.mapToDomain(data);
    }

    async update(input: UpdateProductInput): Promise<Product> {
        const supabase = await createClient();
        const row: ProductUpdate = {
            name: input.name,
            slug: input.slug,
            sku: input.sku,
            meta_title: input.metaTitle,
            meta_description: input.metaDescription || input.shortDescription,
            description: input.description,
            specs: input.specs,
            original_price: input.originalPrice,
            sale_price: input.salePrice,
            images: input.images,
            labels: input.labels,
            is_featured: input.isFeatured,
            is_published: input.isPublished,
            order_index: input.orderIndex,
            category_id: input.categoryId,
            brand_id: input.brandId,
            stock_status: input.stockStatus,
            condition: input.condition,
            mpn: input.mpn,
            gtin: input.gtin,
            updated_at: new Date().toISOString(),
        } as unknown as ProductUpdate;

        const { data, error } = await supabase
            .from(this.TABLE_NAME)
            .update(row)
            .eq("id", input.id)
            .select()
            .single();

        if (error) this.handleError(error, "update");

        return this.mapToDomain(data);
    }

    async delete(id: string): Promise<void> {
        const supabase = await createClient();
        const { error } = await supabase
            .from(this.TABLE_NAME)
            .update({ deleted_at: new Date().toISOString() })
            .eq("id", id);

        if (error) this.handleError(error, "delete");
    }

    async getByIds(ids: string[]): Promise<Product[]> {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from(this.TABLE_NAME)
            .select("*")
            .in("id", ids)
            .is("deleted_at", null);

        if (error) this.handleError(error, "getByIds");
        return (data || []).map((row) => this.mapToDomain(row));
    }

    private applyFilters<T extends {
        is: (col: string, val: null) => T;
        eq: (col: string, val: string | boolean | number) => T;
        in: (col: string, val: string[]) => T;
        ilike: (col: string, val: string) => T;
        or: (val: string) => T;
    }>(query: T, options?: ProductFilter) {
        let q = query.is("deleted_at", null);
        if (!options) return q;
        if (options.categoryId) q = q.eq("category_id", options.categoryId);
        if (options.categoryIds && options.categoryIds.length > 0) {
            q = q.in("category_id", options.categoryIds);
        }
        if (options.brandId) q = q.eq("brand_id", options.brandId);
        if (options.brandIds && options.brandIds.length > 0) {
            q = q.in("brand_id", options.brandIds);
        }
        if (options.isFeatured !== undefined) q = q.eq("is_featured", options.isFeatured);
        if (options.isPublished !== undefined) q = q.eq("is_published", options.isPublished);
        if (options.search) q = q.ilike("name", `%${options.search}%`);

        if (options.minPrice !== undefined && options.maxPrice !== undefined) {
            q = q.or(
                `and(sale_price.gte.${options.minPrice},sale_price.lte.${options.maxPrice}),` +
                `and(sale_price.is.null,original_price.gte.${options.minPrice},original_price.lte.${options.maxPrice})`
            );
        } else if (options.minPrice !== undefined) {
            q = q.or(
                `sale_price.gte.${options.minPrice},` +
                `and(sale_price.is.null,original_price.gte.${options.minPrice})`
            );
        } else if (options.maxPrice !== undefined) {
            q = q.or(
                `sale_price.lte.${options.maxPrice},` +
                `and(sale_price.is.null,original_price.lte.${options.maxPrice})`
            );
        }
        return q;
    }

    private mapToDomain(row: ProductRow): Product {
        const { originalPrice, salePrice, discountPercent } = normalizeProductPrice(
            row.original_price,
            row.sale_price,
            row.discount_percent
        );

        return {
            id: row.id,
            name: row.name,
            slug: row.slug || "",
            sku: row.sku,
            metaTitle: row.meta_title,
            metaDescription: row.meta_description,
            shortDescription: row.meta_description || "",
            description: row.description || null,
            specs: row.specs || null,
            originalPrice,
            salePrice,
            discountPercent,
            images: row.images || [],
            labels: (row as unknown as { labels?: string[] }).labels || [],
            isFeatured: row.is_featured || false,
            isPublished: row.is_published || false,
            orderIndex: row.order_index || 0,
            categoryId: row.category_id || "",
            brandId: row.brand_id || "",
            stockStatus: (row.stock_status as StockStatus) || STOCK_STATUS.IN_STOCK,
            condition: (row.condition as ProductCondition) || "new",
            mpn: (row as unknown as { mpn?: string | null }).mpn || null,
            gtin: (row as unknown as { gtin?: string | null }).gtin || null,
            createdAt: row.created_at || new Date().toISOString(),
            updatedAt: row.updated_at || new Date().toISOString(),
            deletedAt: null,
        };
    }

    private mapToDomainWithRelations(row: ProductRowWithRelations): ProductWithRelations {
        const product = this.mapToDomain(row);
        return {
            ...product,
            category: row.category ? {
                id: row.category.id,
                name: row.category.name,
                slug: row.category.slug || "",
                metaTitle: row.category.meta_title,
                metaDescription: row.category.meta_description,
            } : null,
            brand: row.brand ? {
                id: row.brand.id,
                name: row.brand.name,
                slug: row.brand.slug,
                logoUrl: row.brand.logo_url || "",
                metaTitle: row.brand.meta_title,
                metaDescription: row.brand.meta_description,
                isFeatured: (row.brand as unknown as { is_featured?: boolean }).is_featured || false,
                orderIndex: (row.brand as unknown as { order_index?: number }).order_index || 0,
                createdAt: row.brand.created_at || new Date().toISOString(),
                updatedAt: row.brand.created_at || new Date().toISOString(),
                deletedAt: null,
            } : null,
        };
    }

    private handleError(error: unknown, context: string): never {
        let isAbort = false;
        if (error && typeof error === "object") {
            const errObj = error as Record<string, unknown>;
            const name = typeof errObj.name === "string" ? errObj.name : "";
            const message = typeof errObj.message === "string" ? errObj.message : "";
            if (
                name === "AbortError" || 
                message.includes("AbortError") || 
                message.includes("aborted") ||
                message.includes("operation was aborted") ||
                message.includes("prerender") ||
                message.includes("prerendering")
            ) {
                isAbort = true;
            }
        } else if (error instanceof Error) {
            if (
                error.name === "AbortError" || 
                error.message.includes("AbortError") || 
                error.message.includes("aborted") ||
                error.message.includes("operation was aborted") ||
                error.message.includes("prerender") ||
                error.message.includes("prerendering")
            ) {
                isAbort = true;
            }
        }

        if (isAbort) {
            throw error;
        }

        let message = "Unknown error";
        if (error) {
            if (typeof error === "object") {
                const errObj = error as Record<string, unknown>;
                if (typeof errObj.message === "string") {
                    message = errObj.message;
                    if (typeof errObj.details === "string" && errObj.details) {
                        message += ` (${errObj.details})`;
                    }
                }
            } else if (error instanceof Error) {
                message = error.message;
            }
        }
        console.error(`[SupabaseProductRepository][${context}] Error:`, error);
        throw new Error(`Database error in ${context}: ${message}`);
    }
}

export const productRepo = new SupabaseProductRepository();
