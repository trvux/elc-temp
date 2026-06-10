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

type ProjectRowWithRelations = ProjectRow & {
  projectType: { id: string; name: string; slug: string | null } | null;
  project_category: {
    category: {
      id: string;
      name: string;
      group_id: string | null;
      group_categories: {
        id: string;
        name: string;
      } | null;
    } | null;
  }[] | null;
  project_service: {
    service: {
      id: string;
      title: string;
      slug: string | null;
      group: {
        id: string;
        name: string;
        slug: string | null;
      } | null;
    } | null;
  }[] | null;
};

export class SupabaseProjectRepository implements ProjectRepository {
  private readonly TABLE_NAME = "projects";
  private readonly SELECT_WITH_CATEGORY = `
    *,
    projectType:project_type(id, name, slug),
    project_category(
      category:categories(
        *,
        group_categories(*)
      )
    ),
    project_service(
      service:services(id, title, slug, group:service_groups(id, name, slug))
    )
  `;

  async getAll(options?: ProjectFilter): Promise<ProjectWithCategory[]> {
    const supabase = await createClient();
    let query = supabase.from(this.TABLE_NAME).select(this.SELECT_WITH_CATEGORY);

    // Filters
    if (options?.categoryId) query = query.eq("category_id", options.categoryId);
    if (options?.projectTypeId) query = query.eq("project_type_id", options.projectTypeId);

    if (options?.serviceSlug) {
      const { data: svcData, error: svcError } = await supabase
        .from("services")
        .select("id")
        .eq("slug", options.serviceSlug)
        .is("deleted_at", null)
        .maybeSingle();

      if (svcData && !svcError) {
        const { data: relData, error: relError } = await supabase
          .from("project_service")
          .select("project_id")
          .eq("service_id", svcData.id);

        if (relData && !relError) {
          const projectIds = relData.map((r: { project_id: string }) => r.project_id);
          if (projectIds.length > 0) {
            query = query.in("id", projectIds);
          } else {
            query = query.in("id", ["00000000-0000-0000-0000-000000000000"]);
          }
        } else {
          query = query.in("id", ["00000000-0000-0000-0000-000000000000"]);
        }
      } else {
        query = query.in("id", ["00000000-0000-0000-0000-000000000000"]);
      }
    }

    if (options?.serviceSlugs && options.serviceSlugs.length > 0) {
      const { data: svcsData, error: svcsError } = await supabase
        .from("services")
        .select("id")
        .in("slug", options.serviceSlugs)
        .is("deleted_at", null);

      if (svcsData && svcsData.length > 0 && !svcsError) {
        const svcIds = svcsData.map((s) => s.id);
        const { data: relData, error: relError } = await supabase
          .from("project_service")
          .select("project_id")
          .in("service_id", svcIds);

        if (relData && !relError) {
          const projectIds = relData.map((r: { project_id: string }) => r.project_id);
          if (projectIds.length > 0) {
            query = query.in("id", projectIds);
          } else {
            query = query.in("id", ["00000000-0000-0000-0000-000000000000"]);
          }
        } else {
          query = query.in("id", ["00000000-0000-0000-0000-000000000000"]);
        }
      } else {
        query = query.in("id", ["00000000-0000-0000-0000-000000000000"]);
      }
    }
    
    if (options?.categorySlug) {
      const { data: catData, error: catError } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", options.categorySlug)
        .is("deleted_at", null)
        .maybeSingle();

      if (catData && !catError) {
        const { data: relData, error: relError } = await supabase
          .from("project_category")
          .select("project_id")
          .eq("category_id", catData.id);

        if (relData && !relError) {
          const projectIds = relData.map((r: { project_id: string }) => r.project_id);
          if (projectIds.length > 0) {
            query = query.in("id", projectIds);
          } else {
            query = query.in("id", ["00000000-0000-0000-0000-000000000000"]);
          }
        } else {
          query = query.in("id", ["00000000-0000-0000-0000-000000000000"]);
        }
      } else {
        query = query.in("id", ["00000000-0000-0000-0000-000000000000"]);
      }
    }

    if (options?.categorySlugs && options.categorySlugs.length > 0) {
      const { data: catsData, error: catsError } = await supabase
        .from("categories")
        .select("id")
        .in("slug", options.categorySlugs)
        .is("deleted_at", null);

      if (catsData && catsData.length > 0 && !catsError) {
        const catIds = catsData.map((c) => c.id);
        const { data: relData, error: relError } = await supabase
          .from("project_category")
          .select("project_id")
          .in("category_id", catIds);

        if (relData && !relError) {
          const projectIds = relData.map((r: { project_id: string }) => r.project_id);
          if (projectIds.length > 0) {
            query = query.in("id", projectIds);
          } else {
            query = query.in("id", ["00000000-0000-0000-0000-000000000000"]);
          }
        } else {
          query = query.in("id", ["00000000-0000-0000-0000-000000000000"]);
        }
      } else {
        query = query.in("id", ["00000000-0000-0000-0000-000000000000"]);
      }
    }

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

  async count(options?: Pick<ProjectFilter, "categoryId" | "projectTypeId" | "categorySlug" | "categorySlugs" | "serviceSlug" | "serviceSlugs" | "isPublished" | "isFeatured" | "search" | "includeDeleted">): Promise<number> {
    const supabase = await createClient();
    let query = supabase.from(this.TABLE_NAME).select("*", { count: "exact", head: true });

    if (options?.categoryId) query = query.eq("category_id", options.categoryId);
    if (options?.projectTypeId) query = query.eq("project_type_id", options.projectTypeId);

    if (options?.serviceSlug) {
      const { data: svcData, error: svcError } = await supabase
        .from("services")
        .select("id")
        .eq("slug", options.serviceSlug)
        .is("deleted_at", null)
        .maybeSingle();

      if (svcData && !svcError) {
        const { data: relData, error: relError } = await supabase
          .from("project_service")
          .select("project_id")
          .eq("service_id", svcData.id);

        if (relData && !relError) {
          const projectIds = relData.map((r: { project_id: string }) => r.project_id);
          if (projectIds.length > 0) {
            query = query.in("id", projectIds);
          } else {
            query = query.in("id", ["00000000-0000-0000-0000-000000000000"]);
          }
        } else {
          query = query.in("id", ["00000000-0000-0000-0000-000000000000"]);
        }
      } else {
        query = query.in("id", ["00000000-0000-0000-0000-000000000000"]);
      }
    }

    if (options?.serviceSlugs && options.serviceSlugs.length > 0) {
      const { data: svcsData, error: svcsError } = await supabase
        .from("services")
        .select("id")
        .in("slug", options.serviceSlugs)
        .is("deleted_at", null);

      if (svcsData && svcsData.length > 0 && !svcsError) {
        const svcIds = svcsData.map((s) => s.id);
        const { data: relData, error: relError } = await supabase
          .from("project_service")
          .select("project_id")
          .in("service_id", svcIds);

        if (relData && !relError) {
          const projectIds = relData.map((r: { project_id: string }) => r.project_id);
          if (projectIds.length > 0) {
            query = query.in("id", projectIds);
          } else {
            query = query.in("id", ["00000000-0000-0000-0000-000000000000"]);
          }
        } else {
          query = query.in("id", ["00000000-0000-0000-0000-000000000000"]);
        }
      } else {
        query = query.in("id", ["00000000-0000-0000-0000-000000000000"]);
      }
    }

    if (options?.categorySlug) {
      const { data: catData, error: catError } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", options.categorySlug)
        .is("deleted_at", null)
        .maybeSingle();

      if (catData && !catError) {
        const { data: relData, error: relError } = await supabase
          .from("project_category")
          .select("project_id")
          .eq("category_id", catData.id);

        if (relData && !relError) {
          const projectIds = relData.map((r: { project_id: string }) => r.project_id);
          if (projectIds.length > 0) {
            query = query.in("id", projectIds);
          } else {
            query = query.in("id", ["00000000-0000-0000-0000-000000000000"]);
          }
        } else {
          query = query.in("id", ["00000000-0000-0000-0000-000000000000"]);
        }
      } else {
        query = query.in("id", ["00000000-0000-0000-0000-000000000000"]);
      }
    }

    if (options?.categorySlugs && options.categorySlugs.length > 0) {
      const { data: catsData, error: catsError } = await supabase
        .from("categories")
        .select("id")
        .in("slug", options.categorySlugs)
        .is("deleted_at", null);

      if (catsData && catsData.length > 0 && !catsError) {
        const catIds = catsData.map((c) => c.id);
        const { data: relData, error: relError } = await supabase
          .from("project_category")
          .select("project_id")
          .in("category_id", catIds);

        if (relData && !relError) {
          const projectIds = relData.map((r: { project_id: string }) => r.project_id);
          if (projectIds.length > 0) {
            query = query.in("id", projectIds);
          } else {
            query = query.in("id", ["00000000-0000-0000-0000-000000000000"]);
          }
        } else {
          query = query.in("id", ["00000000-0000-0000-0000-000000000000"]);
        }
      } else {
        query = query.in("id", ["00000000-0000-0000-0000-000000000000"]);
      }
    }

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
      .is("deleted_at", null)
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
      .is("deleted_at", null)
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
        project_type_id: input.projectTypeId,
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

      // Delete existing service relations
      const { error: delSvcError } = await supabase
        .from("project_service")
        .delete()
        .eq("project_id", existing.id);

      if (delSvcError) this.handleError(delSvcError, "create [clear service relations]");
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
        project_type_id: input.projectTypeId,
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

    // Save project services if provided
    if (input.serviceIds && input.serviceIds.length > 0) {
      const svcRelations = input.serviceIds.map(svcId => ({
        project_id: newProject.id,
        service_id: svcId,
      }));

      const { error: svcError } = await supabase
        .from("project_service")
        .insert(svcRelations);

      if (svcError) this.handleError(svcError, "createServiceRelations");
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
      project_type_id: input.projectTypeId,
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

    // Update project services
    if (input.serviceIds !== undefined) {
      const { error: delSvcError } = await supabase
        .from("project_service")
        .delete()
        .eq("project_id", input.id);

      if (delSvcError) this.handleError(delSvcError, "deleteServiceRelations");

      if (input.serviceIds.length > 0) {
        const svcRelations = input.serviceIds.map(svcId => ({
          project_id: input.id,
          service_id: svcId,
        }));

        const { error: insSvcError } = await supabase
          .from("project_service")
          .insert(svcRelations);

        if (insSvcError) this.handleError(insSvcError, "insertServiceRelations");
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
      projectTypeId: row.project_type_id || null,
      createdAt: row.created_at || new Date().toISOString(),
      updatedAt: row.updated_at || new Date().toISOString(),
      deletedAt: row.deleted_at || null,
    };
  }

  private mapToDomainWithCategory(row: ProjectRowWithRelations): ProjectWithCategory {
    const project = this.mapToDomain(row);
    
    const projectType = row.projectType ? {
      id: row.projectType.id,
      name: row.projectType.name,
      slug: row.projectType.slug || "",
    } : null;

    const categories = (row.project_category || [])
      .map((pc) => {
        const cat = pc.category;
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
      .filter((c): c is NonNullable<typeof c> => c !== null);

    const services = (row.project_service || [])
      .map((ps) => {
        const svc = ps.service;
        if (!svc) return null;
        return {
          id: svc.id,
          title: svc.title,
          slug: svc.slug || "",
          group: svc.group ? {
            id: svc.group.id,
            name: svc.group.name,
            slug: svc.group.slug || "",
          } : null,
        };
      })
      .filter((s): s is NonNullable<typeof s> => s !== null);

    return {
      ...project,
      category: null,
      projectType,
      services,
      categories,
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
    console.error(`[SupabaseProjectRepository][${context}] Error:`, error);
    throw new Error(`Database error in ${context}: ${message}`);
  }
}

export const projectRepo = new SupabaseProjectRepository();
