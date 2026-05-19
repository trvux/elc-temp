import { createClient } from "@/shared/lib/supabase/server";
import { Tables, Insert, Update } from "@/shared/types/supabase";
import { 
  Branch, 
  BranchFilter, 
  BranchRepository, 
  CreateBranchInput, 
  Json, 
  UpdateBranchInput 
} from "../domain";

type BranchRow = Tables<"branches">;
type BranchInsert = Insert<"branches">;
type BranchUpdate = Update<"branches">;

export class SupabaseBranchRepository implements BranchRepository {
  private readonly TABLE_NAME = "branches";

  async getAll(options?: BranchFilter): Promise<Branch[]> {
    const supabase = await createClient();
    let query = supabase.from(this.TABLE_NAME).select("*");

    if (options?.isPublished !== undefined) {
      query = query.eq("is_published", options.isPublished);
    }

    if (options?.search) {
      query = query.or(`name.ilike.%${options.search}%,address.ilike.%${options.search}%`);
    }

    query = query.order("order_index", { ascending: true });

    if (options?.limit) {
      const from = options.offset || 0;
      const to = from + options.limit - 1;
      query = query.range(from, to);
    } else if (options?.offset) {
      query = query.range(options.offset, options.offset + 9);
    }

    const { data, error } = await query;
    if (error) this.handleError(error, "getAll");

    return (data || []).map(this.mapToDomain);
  }

  async count(options?: Pick<BranchFilter, "isPublished" | "search">): Promise<number> {
    const supabase = await createClient();
    let query = supabase.from(this.TABLE_NAME).select("*", { count: "exact", head: true });

    if (options?.isPublished !== undefined) {
      query = query.eq("is_published", options.isPublished);
    }

    if (options?.search) {
      query = query.or(`name.ilike.%${options.search}%,address.ilike.%${options.search}%`);
    }

    const { count, error } = await query;
    if (error) this.handleError(error, "count");

    return count || 0;
  }

  async getById(id: string): Promise<Branch | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) this.handleError(error, "getById");
    return data ? this.mapToDomain(data) : null;
  }

  async getBySlug(slug: string): Promise<Branch | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (error) this.handleError(error, "getBySlug");
    return data ? this.mapToDomain(data) : null;
  }

  async create(input: CreateBranchInput): Promise<Branch> {
    const supabase = await createClient();
    const row = this.mapToRow(input) as BranchInsert;

    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .insert(row)
      .select()
      .single();

    if (error) this.handleError(error, "create");
    return this.mapToDomain(data);
  }

  async update(input: UpdateBranchInput): Promise<Branch> {
    const supabase = await createClient();
    const row = this.mapToRow(input) as BranchUpdate;
    
    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .update({
        ...row,
        updated_at: new Date().toISOString(),
      })
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

  async updateOrder(id: string, orderIndex: number): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
      .from(this.TABLE_NAME)
      .update({ 
        order_index: orderIndex,
        updated_at: new Date().toISOString()
      })
      .eq("id", id);

    if (error) this.handleError(error, "updateOrder");
  }

  private mapToRow(input: CreateBranchInput | UpdateBranchInput): Record<string, string | boolean | number | Json | undefined> {
    const row = {
      name: input.name,
      slug: input.slug,
      address: input.address,
      phone: input.phone,
      email: input.email,
      maps_url: "mapsUrl" in input ? input.mapsUrl : undefined,
      maps_embed: "mapsEmbed" in input ? input.mapsEmbed : undefined,
      description: input.description as Json,
      is_published: input.isPublished,
      meta_title: "metaTitle" in input ? input.metaTitle : undefined,
      meta_description: "metaDescription" in input ? input.metaDescription : undefined,
      order_index: input.orderIndex,
    };

    return Object.fromEntries(
      Object.entries(row).filter(([_, value]) => value !== undefined)
    );
  }

  private mapToDomain(row: BranchRow): Branch {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      address: row.address || "",
      phone: row.phone || "",
      email: row.email || "",
      mapsUrl: row.maps_url || "",
      mapsEmbed: row.maps_embed || "",
      description: row.description as Json,
      isPublished: row.is_published ?? false,
      metaTitle: row.meta_title || null,
      metaDescription: row.meta_description || null,
      orderIndex: row.order_index ?? 0,
      createdAt: row.created_at || new Date().toISOString(),
      updatedAt: row.updated_at || new Date().toISOString(),
      deletedAt: null,
    };
  }

  private handleError(error: unknown, context: string): never {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[SupabaseBranchRepository][${context}] Error:`, error);
    throw new Error(`Database error in ${context}: ${message}`);
  }
}

export const branchRepo = new SupabaseBranchRepository();
