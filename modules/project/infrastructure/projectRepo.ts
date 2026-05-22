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
    serviceType:service_type(id, name),
    project_category(
      categoryNew:categories(
        *,
        group_categories(*)
      )
    )
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

    // Check if there is an existing soft-deleted project with the same slug
    const { data: existing, error: findError } = await supabase
      .from(this.TABLE_NAME)
      .select("*")
      .eq("slug", input.slug)
      .not("deleted_at", "is", null)
      .maybeSingle();

    if (findError) this.handleError(findError, "create [find soft-deleted]");

    let newProject: Project;

    if (existing) {
      const updateRow: ProjectUpdate = {
        title: input.title,
        slug: input.slug,
        description: input.description,
        images: input.images,
        is_featured: input.isFeatured,
        is_published: input.isPublished,
        meta_title: input.metaTitle,
        meta_description: input.metaDescription,
        order_index: input.orderIndex,
        category_id: input.categoryId,
        service_type_id: input.serviceTypeId,
        deleted_at: null,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .update(updateRow)
        .eq("id", existing.id)
        .select()
        .single();

      if (error) this.handleError(error, "create [restore]");
      newProject = this.mapToDomain(data);

      // Delete existing relations in join table for this restored project to start fresh
      const { error: delError } = await supabase
        .from("project_category")
        .delete()
        .eq("project_id", existing.id);

      if (delError) this.handleError(delError, "create [clear relations]");
    } else {
      const row: ProjectInsert = {
        title: input.title,
        slug: input.slug,
        description: input.description,
        images: input.images,
        is_featured: input.isFeatured,
        is_published: input.isPublished,
        meta_title: input.metaTitle,
        meta_description: input.metaDescription,
        order_index: input.orderIndex,
        category_id: input.categoryId,
        service_type_id: input.serviceTypeId,
      };

      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .insert(row)
        .select()
        .single();

      if (error) this.handleError(error, "create");
      newProject = this.mapToDomain(data);
    }

    // Save project categories if provided
    if (input.categoryIds && input.categoryIds.length > 0) {
      const relations = input.categoryIds.map(catId => ({
        project_id: newProject.id,
        category_id: catId,
      }));

      const { error: relError } = await supabase
        .from("project_category")
        .insert(relations);

      if (relError) this.handleError(relError, "createRelations");
    }

    return newProject;
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
      meta_title: input.metaTitle,
      meta_description: input.metaDescription,
      order_index: input.orderIndex,
      category_id: input.categoryId,
      service_type_id: input.serviceTypeId,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .update(row)
      .eq("id", input.id)
      .select()
      .single();

    if (error) this.handleError(error, "update");
    const updatedProject = this.mapToDomain(data);

    // Update project categories
    if (input.categoryIds !== undefined) {
      const { error: delError } = await supabase
        .from("project_category")
        .delete()
        .eq("project_id", input.id);

      if (delError) this.handleError(delError, "deleteRelations");

      if (input.categoryIds.length > 0) {
        const relations = input.categoryIds.map(catId => ({
          project_id: input.id,
          category_id: catId,
        }));

        const { error: insError } = await supabase
          .from("project_category")
          .insert(relations);

        if (insError) this.handleError(insError, "insertRelations");
      }
    }

    return updatedProject;
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
      metaTitle: row.meta_title || null,
      metaDescription: row.meta_description || null,
      orderIndex: row.order_index || 0,
      categoryId: row.category_id || "",
      serviceTypeId: row.service_type_id || null,
      createdAt: row.created_at || new Date().toISOString(),
      updatedAt: row.updated_at || new Date().toISOString(),
      deletedAt: row.deleted_at || null,
    };
  }

  private mapToDomainWithCategory(row: any): ProjectWithCategory {
    const project = this.mapToDomain(row);
    
    const serviceType = row.serviceType ? {
      id: row.serviceType.id,
      name: row.serviceType.name,
    } : null;

    const categoriesNew = (row.project_category || [])
      .map((pc: any) => {
        const cat = pc.categoryNew;
        if (!cat) return null;
        return {
          id: cat.id,
          name: cat.name,
          groupId: cat.group_id,
          group: cat.group_categories ? {
            id: cat.group_categories.id,
            name: cat.group_categories.name,
          } : null,
        };
      })
      .filter(Boolean);

    return {
      ...project,
      category: null,
      serviceType,
      categoriesNew,
    };
  }

  private handleError(error: unknown, context: string): never {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[SupabaseProjectRepository][${context}] Error:`, error);
    throw new Error(`Database error in ${context}: ${message}`);
  }
}

export const projectRepo = new SupabaseProjectRepository();
