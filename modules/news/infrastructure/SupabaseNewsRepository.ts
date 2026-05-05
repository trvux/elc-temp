import { createClient } from "@/shared/lib/supabase/server";
import { Tables, Insert, Update } from "@/shared/types/supabase";
import {
  CreateNewsInput,
  News,
  UpdateNewsInput,
  NewsRepository,
  NewsFilter,
} from "../domain";

type NewsRow = Tables<"news">;
type NewsInsert = Insert<"news">;
type NewsUpdate = Update<"news">;

export class SupabaseNewsRepository implements NewsRepository {
  private readonly TABLE_NAME = "news";

  async getAll(options?: NewsFilter): Promise<News[]> {
    const supabase = await createClient();
    let query = supabase.from(this.TABLE_NAME).select("*");

    query = this.applyFilters(query, options);

    query = query.order("order_index", { ascending: true });

    if (options?.limit) {
      const from = options.offset || 0;
      const to = from + options.limit - 1;
      query = query.range(from, to);
    }

    const { data, error } = await query;

    if (error) this.handleError(error, "getAll");

    return (data || []).map((row) => this.mapToDomain(row));
  }

  async count(options?: NewsFilter): Promise<number> {
    const supabase = await createClient();
    let query = supabase.from(this.TABLE_NAME).select("*", { count: "exact", head: true });

    query = this.applyFilters(query, options);

    const { count, error } = await query;
    if (error) this.handleError(error, "count");

    return count || 0;
  }

  async getById(id: string): Promise<News | null> {
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

  async getBySlug(slug: string): Promise<News | null> {
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

  async create(input: CreateNewsInput): Promise<News> {
    const supabase = await createClient();
    const row: NewsInsert = {
      title: input.title,
      slug: input.slug,
      image: input.image || "",
      content: input.content || {},
      is_published: input.isPublished ?? true,
      order_index: input.orderIndex ?? 0,
    };

    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .insert(row)
      .select()
      .single();

    if (error) this.handleError(error, "create");

    return this.mapToDomain(data);
  }

  async update(input: UpdateNewsInput): Promise<News> {
    const supabase = await createClient();
    const row: NewsUpdate = {
      title: input.title,
      slug: input.slug,
      image: input.image,
      content: input.content,
      is_published: input.isPublished,
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
    const { error } = await supabase
      .from(this.TABLE_NAME)
      .update({
        deleted_at: new Date().toISOString(),
      } as NewsUpdate)
      .eq("id", id);

    if (error) this.handleError(error, "delete");
  }

  private applyFilters(query: any, options?: NewsFilter) {
    let q = query;
    if (!options?.includeDeleted) {
      q = q.is("deleted_at", null);
    }
    if (!options) return q;

    if (options.isPublished !== undefined) q = q.eq("is_published", options.isPublished);
    if (options.search) q = q.ilike("title", `%${options.search}%`);
    return q;
  }

  private mapToDomain(row: NewsRow): News {
    return {
      id: row.id,
      title: row.title,
      slug: row.slug,
      image: row.image,
      content: row.content,
      isPublished: row.is_published,
      orderIndex: row.order_index,
      createdAt: row.created_at || new Date().toISOString(),
      updatedAt: row.updated_at || new Date().toISOString(),
      deletedAt: row.deleted_at,
    };
  }

  private handleError(error: unknown, context: string): never {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[SupabaseNewsRepository][${context}] Error:`, error);
    throw new Error(`Database error in ${context}: ${message}`);
  }
}

export const newsRepo = new SupabaseNewsRepository();
