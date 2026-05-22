import { createClient } from "@/shared/lib/supabase/server";
import { CategoryNew, CategoryNewWithGroup, CreateCategoryNewInput, UpdateCategoryNewInput } from "../domain/types";
import { CategoryNewFilter, CategoryNewRepository } from "../domain/repository";

export class SupabaseCategoryNewRepository implements CategoryNewRepository {
  private readonly TABLE_NAME = "category" as any;

  async getAll(options?: CategoryNewFilter): Promise<CategoryNewWithGroup[]> {
    const supabase = await createClient();
    
    let query = supabase
      .from(this.TABLE_NAME)
      .select("*, group_categories(*)");

    if (!options?.includeDeleted) {
      query = query.is("deleted_at", null);
    }

    if (options?.groupId) {
      query = query.eq("group_id", options.groupId);
    }

    if (options?.search) {
      query = query.ilike("name", `%${options.search}%`);
    }

    query = query.order("order_index", { ascending: true }).order("name", { ascending: true });

    if (options?.limit) {
      const from = options.offset || 0;
      const to = from + options.limit - 1;
      query = query.range(from, to);
    }

    const { data, error } = await query;
    if (error) this.handleError(error, "getAll");

    return (data || []).map((row: any) => this.mapToDomainWithGroup(row));
  }

  async count(options?: Pick<CategoryNewFilter, "groupId" | "search" | "includeDeleted">): Promise<number> {
    const supabase = await createClient();
    let query = supabase.from(this.TABLE_NAME).select("*", { count: "exact", head: true });

    if (!options?.includeDeleted) {
      query = query.is("deleted_at", null);
    }

    if (options?.groupId) {
      query = query.eq("group_id", options.groupId);
    }

    if (options?.search) {
      query = query.ilike("name", `%${options.search}%`);
    }

    const { count, error } = await query;
    if (error) this.handleError(error, "count");

    return count || 0;
  }

  async getById(id: string): Promise<CategoryNewWithGroup | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .select("*, group_categories(*)")
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) this.handleError(error, "getById");
    return data ? this.mapToDomainWithGroup(data as any) : null;
  }

  async create(input: CreateCategoryNewInput): Promise<CategoryNew> {
    const supabase = await createClient();
    const row = {
      name: input.name,
      group_id: input.groupId || null,
      slug: input.slug,
      image_url: input.imageUrl || null,
      meta_title: input.metaTitle || null,
      meta_description: input.metaDescription || null,
      is_featured: !!input.isFeatured,
      order_index: Number(input.orderIndex || 0),
    };

    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .insert(row)
      .select()
      .single();

    if (error) this.handleError(error, "create");
    return this.mapToDomain(data);
  }

  async update(input: UpdateCategoryNewInput): Promise<CategoryNew> {
    const supabase = await createClient();
    const row = {
      name: input.name,
      group_id: input.groupId || null,
      slug: input.slug,
      image_url: input.imageUrl || null,
      meta_title: input.metaTitle || null,
      meta_description: input.metaDescription || null,
      is_featured: input.isFeatured !== undefined ? !!input.isFeatured : undefined,
      order_index: input.orderIndex !== undefined ? Number(input.orderIndex || 0) : undefined,
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
    const { error } = await supabase
      .from(this.TABLE_NAME)
      .update({
        deleted_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) this.handleError(error, "delete");
  }

  private mapToDomain(row: any): CategoryNew {
    return {
      id: row.id,
      name: row.name,
      groupId: row.group_id,
      slug: row.slug || "",
      imageUrl: row.image_url || null,
      metaTitle: row.meta_title || null,
      metaDescription: row.meta_description || null,
      isFeatured: row.is_featured || false,
      orderIndex: row.order_index || 0,
      createdAt: row.created_at || new Date().toISOString(),
      updatedAt: row.updated_at || new Date().toISOString(),
      deletedAt: row.deleted_at || null,
    };
  }

  private mapToDomainWithGroup(row: any): CategoryNewWithGroup {
    const category = this.mapToDomain(row);
    const groupRow = row.group_categories;
    
    return {
      ...category,
      group: groupRow ? {
        id: groupRow.id,
        name: groupRow.name,
        slug: groupRow.slug || "",
        imageUrl: groupRow.image_url || null,
        metaTitle: groupRow.meta_title || null,
        metaDescription: groupRow.meta_description || null,
        isFeatured: groupRow.is_featured || false,
        orderIndex: groupRow.order_index || 0,
        createdAt: groupRow.created_at || new Date().toISOString(),
        updatedAt: groupRow.updated_at || new Date().toISOString(),
        deletedAt: groupRow.deleted_at || null,
      } : null,
    };
  }

  private handleError(error: unknown, context: string): never {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[SupabaseCategoryNewRepository][${context}] Error:`, error);
    throw new Error(`Database error in ${context}: ${message}`);
  }
}

export const categoryNewRepo = new SupabaseCategoryNewRepository();
