import { createClient } from "@/shared/lib/supabase/server";
import { Category, CategoryWithGroup, CreateCategoryInput, UpdateCategoryInput } from "../domain/types";
import { CategoryFilter, CategoryRepository } from "../domain/repository";
import { unstable_rethrow } from "next/navigation";

interface CategoryDatabaseRow {
  id: string;
  name: string;
  group_id: string | null;
  slug: string | null;
  image_url: string | null;
  meta_title: string | null;
  meta_description: string | null;
  is_featured: boolean | null;
  order_index: number | null;
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
  content: unknown | null;
  faq: unknown | null;
}

interface CategoryWithGroupDatabaseRow extends CategoryDatabaseRow {
  group_categories?: {
    id: string;
    name: string;
    slug: string | null;
    image_url: string | null;
    meta_title: string | null;
    meta_description: string | null;
    is_featured: boolean | null;
    order_index: number | null;
    created_at: string | null;
    updated_at: string | null;
    deleted_at: string | null;
    content: unknown | null;
    faq: unknown | null;
  } | null;
}

export class SupabaseCategoryRepository implements CategoryRepository {
  private readonly TABLE_NAME = "categories";

  async getAll(options?: CategoryFilter): Promise<CategoryWithGroup[]> {
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

    const rows = data as unknown as CategoryWithGroupDatabaseRow[];
    return (rows || []).map((row) => this.mapToDomainWithGroup(row));
  }

  async count(options?: Pick<CategoryFilter, "groupId" | "search" | "includeDeleted">): Promise<number> {
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

  async getById(id: string): Promise<CategoryWithGroup | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .select("*, group_categories(*)")
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) this.handleError(error, "getById");
    return data ? this.mapToDomainWithGroup(data as unknown as CategoryWithGroupDatabaseRow) : null;
  }

  async create(input: CreateCategoryInput): Promise<Category> {
    const supabase = await createClient();

    // Check if there is an existing soft-deleted category with the same slug
    const { data: existing, error: findError } = await supabase
      .from(this.TABLE_NAME)
      .select("*")
      .eq("slug", input.slug)
      .not("deleted_at", "is", null)
      .maybeSingle();

    if (findError) this.handleError(findError, "create [find soft-deleted]");

    if (existing) {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .update({
          name: input.name,
          group_id: input.groupId || null,
          slug: input.slug,
          image_url: input.imageUrl || null,
          meta_title: input.metaTitle || null,
          meta_description: input.metaDescription || null,
          is_featured: !!input.isFeatured,
          order_index: Number(input.orderIndex || 0),
          content: input.content || null,
          faq: input.faq || null,
          deleted_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select()
        .single();

      if (error) this.handleError(error, "create [restore]");
      return this.mapToDomain(data as unknown as CategoryDatabaseRow);
    }

    const row = {
      name: input.name,
      group_id: input.groupId || null,
      slug: input.slug,
      image_url: input.imageUrl || null,
      meta_title: input.metaTitle || null,
      meta_description: input.metaDescription || null,
      is_featured: !!input.isFeatured,
      order_index: Number(input.orderIndex || 0),
      content: input.content || null,
      faq: input.faq || null,
    };

    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .insert(row)
      .select()
      .single();

    if (error) this.handleError(error, "create");
    return this.mapToDomain(data as unknown as CategoryDatabaseRow);
  }

  async update(input: UpdateCategoryInput): Promise<Category> {
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
      content: input.content !== undefined ? input.content : undefined,
      faq: input.faq !== undefined ? input.faq : undefined,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .update(row)
      .eq("id", input.id)
      .select()
      .single();

    if (error) this.handleError(error, "update");
    return this.mapToDomain(data as unknown as CategoryDatabaseRow);
  }

  async delete(id: string): Promise<void> {
    const supabase = await createClient();
    
    // 1. Soft delete the category
    const { error: catError } = await supabase
      .from(this.TABLE_NAME)
      .update({
        deleted_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (catError) this.handleError(catError, "delete");

    // 2. Clean up associations in project_type_category join table
    const { error: relError } = await supabase
      .from("project_type_category")
      .delete()
      .eq("category_id", id);

    if (relError) this.handleError(relError, "delete");
  }

  private mapToDomain(row: CategoryDatabaseRow): Category {
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
      content: row.content || null,
      faq: Array.isArray(row.faq) ? (row.faq as Array<{ question: string; answer: string }>) : null,
    };
  }

  private mapToDomainWithGroup(row: CategoryWithGroupDatabaseRow): CategoryWithGroup {
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
        content: groupRow.content || null,
        faq: Array.isArray(groupRow.faq) ? (groupRow.faq as Array<{ question: string; answer: string }>) : null,
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

    unstable_rethrow(error);
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
    console.error(`[SupabaseCategoryRepository][${context}] Error:`, error);
    throw new Error(`Database error in ${context}: ${message}`);
  }
}

export const categoryRepo = new SupabaseCategoryRepository();
