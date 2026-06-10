import { createClient } from "@/shared/lib/supabase/server";
import { Insert, Tables, Update } from "@/shared/types/supabase";
import {
  CreatePageInput,
  Page,
  PageFilter,
  PageRepository,
  UpdatePageInput,
} from "../domain";

type PageRow = Tables<"pages">;
type PageInsert = Insert<"pages">;
type PageUpdate = Update<"pages">;

export class SupabasePageRepository implements PageRepository {
  private readonly TABLE_NAME = "pages";

  async getAll(options?: PageFilter): Promise<Page[]> {
    const supabase = await createClient();
    let query = supabase.from(this.TABLE_NAME).select("*");

    query = this.applyFilters(query, options);

    const { data, error } = await query;

    if (error) this.handleError(error, "getAll");

    return (data || []).map((row) => this.mapToDomain(row));
  }

  async count(options?: PageFilter): Promise<number> {
    const supabase = await createClient();
    let query = supabase
      .from(this.TABLE_NAME)
      .select("*", { count: "exact", head: true });

    query = this.applyFilters(query, options);

    const { count, error } = await query;
    if (error) this.handleError(error, "count");

    return count || 0;
  }

  async getById(id: string): Promise<Page | null> {
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

  async getBySlug(slug: string): Promise<Page | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .select("*")
      .eq("slug", slug)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) this.handleError(error, "getBySlug");

    return data ? this.mapToDomain(data) : null;
  }

  async create(input: CreatePageInput): Promise<Page> {
    const supabase = await createClient();
    const row: PageInsert = {
      title: input.title,
      slug: input.slug,
      content: input.content || {},
      is_published: input.isPublished ?? true,
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

  async update(input: UpdatePageInput): Promise<Page> {
    const supabase = await createClient();
    const row: PageUpdate = {
      title: input.title,
      slug: input.slug,
      content: input.content,
      is_published: input.isPublished,
      meta_title: input.metaTitle,
      meta_description: input.metaDescription,
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
      } as PageUpdate)
      .eq("id", id);

    if (error) this.handleError(error, "delete");
  }

  private applyFilters(query: any, options?: PageFilter) {
    let q = query;
    if (!options?.includeDeleted) {
      q = q.is("deleted_at", null);
    }
    if (!options) return q;

    if (options.isPublished !== undefined)
      q = q.eq("is_published", options.isPublished);
    if (options.search) q = q.ilike("title", `%${options.search}%`);
    return q;
  }

  private mapToDomain(row: PageRow): Page {
    return {
      id: row.id,
      title: row.title,
      slug: row.slug,
      content: row.content,
      isPublished: row.is_published,
      metaTitle: row.meta_title || null,
      metaDescription: row.meta_description || null,
      createdAt: row.created_at || new Date().toISOString(),
      updatedAt: row.updated_at || new Date().toISOString(),
      deletedAt: row.deleted_at,
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
    console.error(`[SupabasePageRepository][${context}] Error:`, error);
    throw new Error(`Database error in ${context}: ${message}`);
  }
}

export const pageRepo = new SupabasePageRepository();
