import { createClient } from "@/shared/lib/supabase/server";
import { Tables, Insert, Update } from "@/shared/types/supabase";
import { 
  Brand, 
  BrandFilter, 
  BrandRepository, 
  CreateBrandInput, 
  UpdateBrandInput 
} from "../domain";

type BrandRow = Tables<"brands">;
type BrandInsert = Insert<"brands">;
type BrandUpdate = Update<"brands">;

type ExtendedBrandRow = BrandRow & { is_featured?: boolean; order_index?: number; content?: unknown; faq?: unknown };
type ExtendedBrandInsert = BrandInsert & { is_featured?: boolean; order_index?: number; content?: unknown; faq?: unknown };
type ExtendedBrandUpdate = BrandUpdate & { is_featured?: boolean; order_index?: number; content?: unknown; faq?: unknown };

export class SupabaseBrandRepository implements BrandRepository {
  private readonly TABLE_NAME = "brands";

  async getAll(options?: BrandFilter): Promise<Brand[]> {
    const supabase = await createClient();
    let query = supabase.from(this.TABLE_NAME).select("*");

    if (options?.search) {
      query = query.ilike("name", `%${options.search}%`);
    }

    if (!options?.includeDeleted) {
      query = query.is("deleted_at", null);
    }

    query = query
      .order("order_index", { ascending: true })
      .order("name", { ascending: true });

    if (options?.limit) {
      const from = options.offset || 0;
      const to = from + options.limit - 1;
      query = query.range(from, to);
    }

    const { data, error } = await query;
    if (error) this.handleError(error, "getAll");

    return (data || []).map((row) => this.mapToDomain(row as ExtendedBrandRow));
  }

  async count(options?: Pick<BrandFilter, "search" | "includeDeleted">): Promise<number> {
    const supabase = await createClient();
    let query = supabase.from(this.TABLE_NAME).select("*", { count: "exact", head: true });

    if (options?.search) {
      query = query.ilike("name", `%${options.search}%`);
    }

    const { count, error } = await query;
    if (error) this.handleError(error, "count");

    return count || 0;
  }

  async getById(id: string): Promise<Brand | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) this.handleError(error, "getById");
    return data ? this.mapToDomain(data as ExtendedBrandRow) : null;
  }

  async getBySlug(slug: string): Promise<Brand | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (error) this.handleError(error, "getBySlug");
    return data ? this.mapToDomain(data as ExtendedBrandRow) : null;
  }

  async create(input: CreateBrandInput): Promise<Brand> {
    const supabase = await createClient();
    const row: ExtendedBrandInsert = {
      name: input.name,
      slug: input.slug,
      logo_url: input.logoUrl,
      is_featured: input.isFeatured,
      order_index: input.orderIndex,
      meta_title: input.metaTitle,
      meta_description: input.metaDescription,
      content: input.content || null,
      faq: input.faq || null,
    };

    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .insert(row as BrandInsert)
      .select()
      .single();

    if (error) this.handleError(error, "create");
    return this.mapToDomain(data as ExtendedBrandRow);
  }

  async update(input: UpdateBrandInput): Promise<Brand> {
    const supabase = await createClient();
    const row: ExtendedBrandUpdate = {
      name: input.name,
      slug: input.slug,
      logo_url: input.logoUrl,
      is_featured: input.isFeatured,
      order_index: input.orderIndex,
      meta_title: input.metaTitle,
      meta_description: input.metaDescription,
      content: input.content !== undefined ? input.content : undefined,
      faq: input.faq !== undefined ? input.faq : undefined,
    };
    
    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .update(row as BrandUpdate)
      .eq("id", input.id)
      .select()
      .single();

    if (error) this.handleError(error, "update");
    return this.mapToDomain(data as ExtendedBrandRow);
  }

  async delete(id: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
      .from(this.TABLE_NAME)
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);

    if (error) this.handleError(error, "delete");
  }

  async getByIds(ids: string[]): Promise<Brand[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .select("*")
      .in("id", ids)
      .is("deleted_at", null);

    if (error) this.handleError(error, "getByIds");
    return (data || []).map((row) => this.mapToDomain(row as ExtendedBrandRow));
  }

  private mapToDomain(row: ExtendedBrandRow): Brand {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      logoUrl: row.logo_url || "",
      isFeatured: row.is_featured || false,
      orderIndex: row.order_index || 0,
      metaTitle: row.meta_title || null,
      metaDescription: row.meta_description || null,
      createdAt: row.created_at || new Date().toISOString(),
      updatedAt: row.created_at || new Date().toISOString(),
      deletedAt: row.deleted_at || null,
      content: row.content || null,
      faq: Array.isArray(row.faq) ? (row.faq as Array<{ question: string; answer: string }>) : null,
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
    console.error(`[SupabaseBrandRepository][${context}] Error:`, error);
    throw new Error(`Database error in ${context}: ${message}`);
  }
}

export const brandRepo = new SupabaseBrandRepository();
