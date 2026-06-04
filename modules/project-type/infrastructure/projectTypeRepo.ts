import { createClient } from "@/shared/lib/supabase/server";
import { Tables, Insert, Update } from "@/shared/types/supabase";
import { ProjectType, ProjectTypeWithCategories, CreateProjectTypeInput, UpdateProjectTypeInput } from "../domain/types";
import { ProjectTypeFilter, ProjectTypeRepository } from "../domain/repository";

type ProjectTypeRow = Tables<"project_type">;
type ProjectTypeInsert = Insert<"project_type">;
type ProjectTypeUpdate = Update<"project_type">;

export class SupabaseProjectTypeRepository implements ProjectTypeRepository {
  private readonly TABLE_NAME = "project_type";
  private readonly JOIN_TABLE_NAME = "project_type_category";

  async getAll(options?: ProjectTypeFilter): Promise<ProjectTypeWithCategories[]> {
    const supabase = await createClient();
    
    let query = supabase
      .from(this.TABLE_NAME)
      .select(`
        *,
        project_type_category(
          categories(
            *,
            group_categories(*)
          )
        )
      `);

    if (!options?.includeDeleted) {
      query = query.is("deleted_at", null);
    }

    if (options?.search) {
      query = query.ilike("name", `%${options.search}%`);
    }

    query = query.order("order_index", { ascending: true });

    if (options?.limit) {
      const from = options.offset || 0;
      const to = from + options.limit - 1;
      query = query.range(from, to);
    }

    const { data, error } = await query;
    if (error) this.handleError(error, "getAll");

    return (data || []).map(row => this.mapToDomainWithCategories(row));
  }

  async count(options?: Pick<ProjectTypeFilter, "search" | "includeDeleted">): Promise<number> {
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

  async getById(id: string): Promise<ProjectTypeWithCategories | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .select(`
        *,
        project_type_category(
          categories(
            *,
            group_categories(*)
          )
        )
      `)
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) this.handleError(error, "getById");
    return data ? this.mapToDomainWithCategories(data) : null;
  }

  async create(input: CreateProjectTypeInput): Promise<ProjectType> {
    const supabase = await createClient();

    // Check if there is an existing soft-deleted service type with the same slug
    const { data: existing, error: findError } = await supabase
      .from(this.TABLE_NAME)
      .select("*")
      .eq("slug", input.slug)
      .not("deleted_at", "is", null)
      .maybeSingle();

    if (findError) this.handleError(findError, "create [find soft-deleted]");

    let newProjectType: ProjectType;

    if (existing) {
      const updateRow: ProjectTypeUpdate = {
        name: input.name,
        slug: input.slug,
        image: input.image || null,
        meta_title: input.metaTitle || null,
        meta_description: input.metaDescription || null,
        is_featured: input.isFeatured || false,
        order_index: input.orderIndex || 0,
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
      newProjectType = this.mapToDomain(data);

      // Delete existing relations in join table for this restored service type to start fresh
      const { error: delError } = await supabase
        .from(this.JOIN_TABLE_NAME)
        .delete()
        .eq("project_type_id", existing.id);

      if (delError) this.handleError(delError, "create [clear relations]");
    } else {
      const row: ProjectTypeInsert = {
        name: input.name,
        slug: input.slug,
        image: input.image || null,
        meta_title: input.metaTitle || null,
        meta_description: input.metaDescription || null,
        is_featured: input.isFeatured || false,
        order_index: input.orderIndex || 0,
      };

      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .insert(row)
        .select()
        .single();

      if (error) this.handleError(error, "create");
      newProjectType = this.mapToDomain(data);
    }

    // 2. Insert relations if provided
    if (input.categoryIds && input.categoryIds.length > 0) {
      const relations = input.categoryIds.map(catId => ({
        project_type_id: newProjectType.id,
        category_id: catId,
      }));

      const { error: relError } = await supabase
        .from(this.JOIN_TABLE_NAME)
        .insert(relations);

      if (relError) this.handleError(relError, "createRelations");
    }

    return newProjectType;
  }

  async update(input: UpdateProjectTypeInput): Promise<ProjectType> {
    const supabase = await createClient();
    
    // 1. Update service type
    const row: any = {
      name: input.name,
      slug: input.slug,
      image: input.image,
      meta_title: input.metaTitle,
      meta_description: input.metaDescription,
      is_featured: input.isFeatured,
      order_index: input.orderIndex,
      updated_at: new Date().toISOString(),
    };

    // Filter out undefined keys to prevent erasing existing values
    Object.keys(row).forEach(key => {
      if (row[key] === undefined) delete row[key];
    });

    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .update(row)
      .eq("id", input.id)
      .select()
      .single();

    if (error) this.handleError(error, "update");
    const updatedProjectType = this.mapToDomain(data);

    // 2. Update relations if provided
    if (input.categoryIds !== undefined) {
      // Delete existing relations
      const { error: delError } = await supabase
        .from(this.JOIN_TABLE_NAME)
        .delete()
        .eq("project_type_id", input.id);

      if (delError) this.handleError(delError, "deleteRelations");

      // Insert new relations
      if (input.categoryIds.length > 0) {
        const relations = input.categoryIds.map(catId => ({
          project_type_id: input.id,
          category_id: catId,
        }));

        const { error: insError } = await supabase
          .from(this.JOIN_TABLE_NAME)
          .insert(relations);

        if (insError) this.handleError(insError, "insertRelations");
      }
    }

    return updatedProjectType;
  }

  async delete(id: string): Promise<void> {
    const supabase = await createClient();
    
    // 1. Soft delete the service type itself
    const { error: projectTypeError } = await supabase
      .from(this.TABLE_NAME)
      .update({
        deleted_at: new Date().toISOString(),
      } as ProjectTypeUpdate)
      .eq("id", id);

    if (projectTypeError) this.handleError(projectTypeError, "delete");

    // 2. Set project_type_id = null for referencing projects
    const { error: projectError } = await supabase
      .from("projects")
      .update({
        project_type_id: null,
      })
      .eq("project_type_id", id);

    if (projectError) this.handleError(projectError, "delete");

    // 3. Clean up associations in project_type_category join table
    const { error: relError } = await supabase
      .from(this.JOIN_TABLE_NAME)
      .delete()
      .eq("project_type_id", id);

    if (relError) this.handleError(relError, "delete");
  }

  private mapToDomain(row: any): ProjectType {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug || "",
      image: row.image || null,
      metaTitle: row.meta_title || null,
      metaDescription: row.meta_description || null,
      isFeatured: row.is_featured || false,
      orderIndex: row.order_index || 0,
      createdAt: row.created_at || new Date().toISOString(),
      updatedAt: row.updated_at || new Date().toISOString(),
      deletedAt: row.deleted_at || null,
    };
  }

  private mapToDomainWithCategories(row: any): ProjectTypeWithCategories {
    const projectType = this.mapToDomain(row);
    
    const categories = (row.project_type_category || [])
      .map((stc: any) => {
        const cat = stc.categories;
        if (!cat || cat.deleted_at) return null;
        return {
          id: cat.id,
          name: cat.name,
          groupId: cat.group_id,
          createdAt: cat.created_at || new Date().toISOString(),
          updatedAt: cat.updated_at || new Date().toISOString(),
          deletedAt: cat.deleted_at || null,
          group: cat.group_categories ? {
            id: cat.group_categories.id,
            name: cat.group_categories.name,
            createdAt: cat.group_categories.created_at || new Date().toISOString(),
            updatedAt: cat.group_categories.updated_at || new Date().toISOString(),
            deletedAt: cat.group_categories.deleted_at || null,
          } : null,
        };
      })
      .filter(Boolean);

    return {
      ...projectType,
      categories,
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
    console.error(`[SupabaseProjectTypeRepository][${context}] Error:`, error);
    throw new Error(`Database error in ${context}: ${message}`);
  }
}

export const projectTypeRepo = new SupabaseProjectTypeRepository();
