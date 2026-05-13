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
    StockStatus
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

        return (data || []).map((row) => this.mapToDomainWithRelations(row));
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
        return data ? this.mapToDomainWithRelations(data) : null;
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
        return data ? this.mapToDomainWithRelations(data) : null;
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
            is_featured: input.isFeatured,
            is_published: input.isPublished,
            order_index: input.orderIndex,
            category_id: input.categoryId,
            brand_id: input.brandId,
            stock_status: input.stockStatus || STOCK_STATUS.IN_STOCK,
        };

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
            is_featured: input.isFeatured,
            is_published: input.isPublished,
            order_index: input.orderIndex,
            category_id: input.categoryId,
            brand_id: input.brandId,
            stock_status: input.stockStatus,
            updated_at: new Date().toISOString(),
        };

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
        const { error } = await supabase.from(this.TABLE_NAME).delete().eq("id", id);

        if (error) this.handleError(error, "delete");
    }

    async getByIds(ids: string[]): Promise<Product[]> {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from(this.TABLE_NAME)
            .select("*")
            .in("id", ids);

        if (error) this.handleError(error, "getByIds");
        return (data || []).map((row) => this.mapToDomain(row));
    }

    private applyFilters(query: any, options?: ProductFilter) {
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
            originalPrice: row.original_price || 0,
            salePrice: row.sale_price || 0,
            discountPercent: row.discount_percent || 0,
            images: row.images || [],
            isFeatured: row.is_featured || false,
            isPublished: row.is_published || false,
            orderIndex: row.order_index || 0,
            categoryId: row.category_id || "",
            brandId: row.brand_id || "",
            stockStatus: (row.stock_status as StockStatus) || STOCK_STATUS.IN_STOCK,
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
                description: row.brand.description || "",
                createdAt: row.brand.created_at || new Date().toISOString(),
                updatedAt: row.brand.created_at || new Date().toISOString(),
                deletedAt: null,
            } : null,
        };
    }

    private handleError(error: unknown, context: string): never {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error(`[SupabaseProductRepository][${context}] Error:`, error);
        throw new Error(`Database error in ${context}: ${message}`);
    }
}

export const productRepo = new SupabaseProductRepository();
