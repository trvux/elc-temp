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

export class SupabaseBrandRepository implements BrandRepository {
  private readonly TABLE_NAME = "brands";

  async getAll(options?: BrandFilter): Promise<Brand[]> {
    const supabase = await createClient();
    let query = supabase.from(this.TABLE_NAME).select("*");

    if (options?.search) {
      query = query.ilike("name", `%${options.search}%`);
    }

    query = query.order("name", { ascending: true });

    if (options?.limit) {
      const from = options.offset || 0;
      const to = from + options.limit - 1;
      query = query.range(from, to);
    }

    const { data, error } = await query;
    if (error) this.handleError(error, "getAll");

    return (data || []).map(this.mapToDomain);
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
    return data ? this.mapToDomain(data) : null;
  }

  async getBySlug(slug: string): Promise<Brand | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (error) this.handleError(error, "getBySlug");
    return data ? this.mapToDomain(data) : null;
  }

  async create(input: CreateBrandInput): Promise<Brand> {
    const supabase = await createClient();
    const row: BrandInsert = {
      name: input.name,
      slug: input.slug,
      logo_url: input.logoUrl,
      description: input.description,
      meta_title: input.metaTitle,
      meta_description: input.metaDescription,
    };

    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .insert(row)
      .select()
      .single();

    if (error) this.handleError(error, "create");
    return this.mapToDomain(data);
  }

  async update(input: UpdateBrandInput): Promise<Brand> {
    const supabase = await createClient();
    const row: BrandUpdate = {
      name: input.name,
      slug: input.slug,
      logo_url: input.logoUrl,
      description: input.description,
      meta_title: input.metaTitle,
      meta_description: input.metaDescription,
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
    const { error } = await supabase
      .from(this.TABLE_NAME)
      .delete()
      .eq("id", id);

    if (error) this.handleError(error, "delete");
  }

  async getByIds(ids: string[]): Promise<Brand[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .select("*")
      .in("id", ids);

    if (error) this.handleError(error, "getByIds");
    return (data || []).map(this.mapToDomain);
  }

  private mapToDomain(row: BrandRow): Brand {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      logoUrl: row.logo_url || "",
      description: row.description || "",
      metaTitle: row.meta_title || null,
      metaDescription: row.meta_description || null,
      createdAt: row.created_at || new Date().toISOString(),
      updatedAt: row.created_at || new Date().toISOString(), // brands table might not have updated_at
      deletedAt: null,
    };
  }

  private handleError(error: unknown, context: string): never {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[SupabaseBrandRepository][${context}] Error:`, error);
    throw new Error(`Database error in ${context}: ${message}`);
  }
}

export const brandRepo = new SupabaseBrandRepository();
