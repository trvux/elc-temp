import { createClient } from "@/shared/lib/supabase/server";
import { Tables, Insert, Update } from "@/shared/types/supabase";
import { 
  Project, 
  ProjectWithCategory, 
  CreateProjectInput, 
  UpdateProjectInput,
  ProjectFilter,
  ProjectRepository
} from "../domain";

type ProjectRow = Tables<"projects">;
type ProjectInsert = Insert<"projects">;
type ProjectUpdate = Update<"projects">;

export class SupabaseProjectRepository implements ProjectRepository {
  private readonly TABLE_NAME = "projects";
  private readonly SELECT_WITH_CATEGORY = `
    *,
    category:categories(id, name, slug, parent:categories!parent_id(id, name, slug))
  `;

  async getAll(options?: ProjectFilter): Promise<ProjectWithCategory[]> {
    const supabase = await createClient();
    let query = supabase.from(this.TABLE_NAME).select(this.SELECT_WITH_CATEGORY);

    // Filters
    if (options?.categoryId) query = query.eq("category_id", options.categoryId);
    if (options?.isPublished !== undefined) query = query.eq("is_published", options.isPublished);
    if (options?.isFeatured !== undefined) query = query.eq("is_featured", options.isFeatured);
    if (options?.search) query = query.ilike("title", `%${options.search}%`);
    
    // Soft delete check
    if (!options?.includeDeleted) {
      query = query.is("deleted_at", null);
    }

    // Ordering
    const orderBy = options?.orderBy || "orderIndex";
    const orderDirection = options?.orderDirection || "asc";
    query = query.order(this.mapOrderBy(orderBy), { ascending: orderDirection === "asc" });

    // Pagination
    if (options?.limit) {
      const from = options.offset || 0;
      const to = from + options.limit - 1;
      query = query.range(from, to);
    }

    const { data, error } = await query;
    if (error) this.handleError(error, "getAll");

    return (data || []).map((row) => this.mapToDomainWithCategory(row));
  }

  async count(options?: Pick<ProjectFilter, "categoryId" | "isPublished" | "isFeatured" | "search" | "includeDeleted">): Promise<number> {
    const supabase = await createClient();
    let query = supabase.from(this.TABLE_NAME).select("*", { count: "exact", head: true });

    if (options?.categoryId) query = query.eq("category_id", options.categoryId);
    if (options?.isPublished !== undefined) query = query.eq("is_published", options.isPublished);
    if (options?.isFeatured !== undefined) query = query.eq("is_featured", options.isFeatured);
    if (options?.search) query = query.ilike("title", `%${options.search}%`);
    if (!options?.includeDeleted) query = query.is("deleted_at", null);

    const { count, error } = await query;
    if (error) this.handleError(error, "count");

    return count || 0;
  }

  async getById(id: string): Promise<ProjectWithCategory | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .select(this.SELECT_WITH_CATEGORY)
      .eq("id", id)
      .maybeSingle();

    if (error) this.handleError(error, "getById");
    return data ? this.mapToDomainWithCategory(data) : null;
  }

  async getBySlug(slug: string): Promise<ProjectWithCategory | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .select(this.SELECT_WITH_CATEGORY)
      .eq("slug", slug)
      .maybeSingle();

    if (error) this.handleError(error, "getBySlug");
    return data ? this.mapToDomainWithCategory(data) : null;
  }

  async create(input: CreateProjectInput): Promise<Project> {
    const supabase = await createClient();
    const row: ProjectInsert = {
      title: input.title,
      slug: input.slug,
      description: input.description,
      images: input.images,
      is_featured: input.isFeatured,
      is_published: input.isPublished,
      order_index: input.orderIndex,
      category_id: input.categoryId,
    };

    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .insert(row)
      .select()
      .single();

    if (error) this.handleError(error, "create");
    return this.mapToDomain(data);
  }

  async update(input: UpdateProjectInput): Promise<Project> {
    const supabase = await createClient();
    const row: ProjectUpdate = {
      title: input.title,
      slug: input.slug,
      description: input.description,
      images: input.images,
      is_featured: input.isFeatured,
      is_published: input.isPublished,
      order_index: input.orderIndex,
      category_id: input.categoryId,
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
    // Soft delete: cập nhật trường deleted_at thay vì xóa cứng
    const { error } = await supabase
      .from(this.TABLE_NAME)
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);

    if (error) this.handleError(error, "delete");
  }

  async getByIds(ids: string[]): Promise<ProjectWithCategory[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .select(this.SELECT_WITH_CATEGORY)
      .in("id", ids);

    if (error) this.handleError(error, "getByIds");
    return (data || []).map((row) => this.mapToDomainWithCategory(row));
  }

  async updateOrder(id: string, orderIndex: number): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
      .from(this.TABLE_NAME)
      .update({ order_index: orderIndex })
      .eq("id", id);

    if (error) this.handleError(error, "updateOrder");
  }

  async togglePublish(id: string, isPublished: boolean): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
      .from(this.TABLE_NAME)
      .update({ is_published: isPublished })
      .eq("id", id);

    if (error) this.handleError(error, "togglePublish");
  }

  async toggleFeatured(id: string, isFeatured: boolean): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
      .from(this.TABLE_NAME)
      .update({ is_featured: isFeatured })
      .eq("id", id);

    if (error) this.handleError(error, "toggleFeatured");
  }

  async getFeatured(limit: number = 4): Promise<ProjectWithCategory[]> {
    return this.getAll({ isPublished: true, isFeatured: true, limit });
  }

  async getRelated(projectId: string, categoryId: string, limit: number = 4): Promise<ProjectWithCategory[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .select(this.SELECT_WITH_CATEGORY)
      .eq("category_id", categoryId)
      .neq("id", projectId)
      .eq("is_published", true)
      .is("deleted_at", null)
      .order("order_index", { ascending: true })
      .limit(limit);

    if (error) this.handleError(error, "getRelated");
    return (data || []).map((row) => this.mapToDomainWithCategory(row));
  }

  private mapOrderBy(orderBy: string): string {
    switch (orderBy) {
      case "orderIndex": return "order_index";
      case "createdAt": return "created_at";
      case "title": return "title";
      default: return "order_index";
    }
  }

  private mapToDomain(row: ProjectRow): Project {
    return {
      id: row.id,
      title: row.title,
      slug: row.slug || "",
      description: row.description || null,
      images: row.images || [],
      isFeatured: row.is_featured || false,
      isPublished: row.is_published || false,
      orderIndex: row.order_index || 0,
      categoryId: row.category_id || "",
      createdAt: row.created_at || new Date().toISOString(),
      updatedAt: row.updated_at || new Date().toISOString(),
      deletedAt: row.deleted_at || null,
    };
  }

  private mapToDomainWithCategory(row: any): ProjectWithCategory {
    const project = this.mapToDomain(row);
    return {
      ...project,
      category: row.category ? {
        id: row.category.id,
        name: row.category.name,
        slug: row.category.slug || "",
        parent: row.category.parent ? {
          id: row.category.parent.id,
          name: row.category.parent.name,
          slug: row.category.parent.slug || ""
        } : null
      } : null,
    };
  }

  private handleError(error: unknown, context: string): never {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[SupabaseProjectRepository][${context}] Error:`, error);
    throw new Error(`Database error in ${context}: ${message}`);
  }
}

export const projectRepo = new SupabaseProjectRepository();
