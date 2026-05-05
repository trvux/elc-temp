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
      createdAt: row.created_at || new Date().toISOString(),
      updatedAt: row.updated_at || new Date().toISOString(),
      deletedAt: row.deleted_at,
    };
  }

  private handleError(error: unknown, context: string): never {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[SupabasePageRepository][${context}] Error:`, error);
    throw new Error(`Database error in ${context}: ${message}`);
  }
}

export const pageRepo = new SupabasePageRepository();
