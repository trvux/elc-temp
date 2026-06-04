import { createClient } from "@/shared/lib/supabase/server";
import { Group, CreateGroupInput, UpdateGroupInput } from "../domain/types";
import { GroupFilter, GroupRepository } from "../domain/repository";

export class SupabaseGroupRepository implements GroupRepository {
  private readonly TABLE_NAME = "group_categories" as any;

  async getAll(options?: GroupFilter): Promise<Group[]> {
    const supabase = await createClient();
    let query = supabase.from(this.TABLE_NAME).select("*");

    if (!options?.includeDeleted) {
      query = query.is("deleted_at", null);
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

    return (data || []).map(row => this.mapToDomain(row));
  }

  async count(options?: Pick<GroupFilter, "search" | "includeDeleted">): Promise<number> {
    const supabase = await createClient();
    let query = supabase.from(this.TABLE_NAME).select("*", { count: "exact", head: true });

    if (!options?.includeDeleted) {
      query = query.is("deleted_at", null);
    }

    if (options?.search) {
      query = query.ilike("name", `%${options.search}%`);
    }

    const { count, error } = await query;
    if (error) this.handleError(error, "count");

    return count || 0;
  }

  async getById(id: string): Promise<Group | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .select("*")
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) this.handleError(error, "getById");
    return data ? this.mapToDomain(data) : null;
  }

  async create(input: CreateGroupInput): Promise<Group> {
    const supabase = await createClient();

    // Check if there is an existing soft-deleted group category with the same slug
    const { data: existing, error: findError } = await (supabase
      .from(this.TABLE_NAME)
      .select("*")
      .eq("slug", input.slug)
      .not("deleted_at", "is", null)
      .maybeSingle() as unknown as Promise<{ data: Record<string, unknown> | null; error: unknown }>);

    if (findError) this.handleError(findError, "create [find soft-deleted]");

    if (existing) {
      const { data, error } = await (supabase
        .from(this.TABLE_NAME)
        .update({
          name: input.name,
          slug: input.slug,
          image_url: input.imageUrl,
          meta_title: input.metaTitle,
          meta_description: input.metaDescription,
          is_featured: input.isFeatured,
          order_index: input.orderIndex,
          deleted_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id as string)
        .select()
        .single() as unknown as Promise<{ data: Record<string, unknown> | null; error: unknown }>);

      if (error) this.handleError(error, "create [restore]");
      return this.mapToDomain(data);
    }

    const row = {
      name: input.name,
      slug: input.slug,
      image_url: input.imageUrl,
      meta_title: input.metaTitle,
      meta_description: input.metaDescription,
      is_featured: input.isFeatured,
      order_index: input.orderIndex,
    };

    const { data, error } = await (supabase
      .from(this.TABLE_NAME)
      .insert(row)
      .select()
      .single() as unknown as Promise<{ data: Record<string, unknown> | null; error: unknown }>);

    if (error) this.handleError(error, "create");
    return this.mapToDomain(data);
  }

  async update(input: UpdateGroupInput): Promise<Group> {
    const supabase = await createClient();
    const row = {
      name: input.name,
      slug: input.slug,
      image_url: input.imageUrl,
      meta_title: input.metaTitle,
      meta_description: input.metaDescription,
      is_featured: input.isFeatured,
      order_index: input.orderIndex,
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
    
    // 1. Soft delete the group category itself
    const { error: groupError } = await supabase
      .from(this.TABLE_NAME)
      .update({
        deleted_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (groupError) this.handleError(groupError, "delete");

    // 2. Fetch all active categories under this group
    const { data: categories, error: fetchError } = await supabase
      .from("categories")
      .select("id")
      .eq("group_id", id)
      .is("deleted_at", null);

    if (fetchError) this.handleError(fetchError, "delete");

    if (categories && categories.length > 0) {
      const categoryIds = categories.map((cat) => cat.id);

      // 3. Soft delete those categories
      const { error: catError } = await supabase
        .from("categories")
        .update({
          deleted_at: new Date().toISOString(),
        })
        .in("id", categoryIds);

      if (catError) this.handleError(catError, "delete");

      // 4. Clean up associations in project_type_category join table
      const { error: relError } = await supabase
        .from("project_type_category")
        .delete()
        .in("category_id", categoryIds);

      if (relError) this.handleError(relError, "delete");
    }
  }

  private mapToDomain(row: any): Group {
    return {
      id: row.id,
      name: row.name,
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

  private handleError(error: unknown, context: string): never {
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
    console.error(`[SupabaseGroupRepository][${context}] Error:`, error);
    throw new Error(`Database error in ${context}: ${message}`);
  }
}

export const groupRepo = new SupabaseGroupRepository();
