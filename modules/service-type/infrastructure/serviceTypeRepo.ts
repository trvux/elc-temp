import { createClient } from "@/shared/lib/supabase/server";
import { Tables, Insert, Update } from "@/shared/types/supabase";
import { ServiceType, ServiceTypeWithCategories, CreateServiceTypeInput, UpdateServiceTypeInput } from "../domain/types";
import { ServiceTypeFilter, ServiceTypeRepository } from "../domain/repository";

type ServiceTypeRow = Tables<"service_type">;
type ServiceTypeInsert = Insert<"service_type">;
type ServiceTypeUpdate = Update<"service_type">;

export class SupabaseServiceTypeRepository implements ServiceTypeRepository {
  private readonly TABLE_NAME = "service_type";
  private readonly JOIN_TABLE_NAME = "service_type_category";

  async getAll(options?: ServiceTypeFilter): Promise<ServiceTypeWithCategories[]> {
    const supabase = await createClient();
    
    let query = supabase
      .from(this.TABLE_NAME)
      .select(`
        *,
        service_type_category(
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

  async count(options?: Pick<ServiceTypeFilter, "search" | "includeDeleted">): Promise<number> {
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

  async getById(id: string): Promise<ServiceTypeWithCategories | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .select(`
        *,
        service_type_category(
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

  async create(input: CreateServiceTypeInput): Promise<ServiceType> {
    const supabase = await createClient();
    
    // 1. Create service type
    const row: any = {
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
    const newServiceType = this.mapToDomain(data);

    // 2. Insert relations if provided
    if (input.categoryIds && input.categoryIds.length > 0) {
      const relations = input.categoryIds.map(catId => ({
        service_type_id: newServiceType.id,
        category_id: catId,
      }));

      const { error: relError } = await supabase
        .from(this.JOIN_TABLE_NAME)
        .insert(relations);

      if (relError) this.handleError(relError, "createRelations");
    }

    return newServiceType;
  }

  async update(input: UpdateServiceTypeInput): Promise<ServiceType> {
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
    const updatedServiceType = this.mapToDomain(data);

    // 2. Update relations if provided
    if (input.categoryIds !== undefined) {
      // Delete existing relations
      const { error: delError } = await supabase
        .from(this.JOIN_TABLE_NAME)
        .delete()
        .eq("service_type_id", input.id);

      if (delError) this.handleError(delError, "deleteRelations");

      // Insert new relations
      if (input.categoryIds.length > 0) {
        const relations = input.categoryIds.map(catId => ({
          service_type_id: input.id,
          category_id: catId,
        }));

        const { error: insError } = await supabase
          .from(this.JOIN_TABLE_NAME)
          .insert(relations);

        if (insError) this.handleError(insError, "insertRelations");
      }
    }

    return updatedServiceType;
  }

  async delete(id: string): Promise<void> {
    const supabase = await createClient();
    
    // Soft delete the service type
    const { error } = await supabase
      .from(this.TABLE_NAME)
      .update({
        deleted_at: new Date().toISOString(),
      } as ServiceTypeUpdate)
      .eq("id", id);

    if (error) this.handleError(error, "delete");
  }

  private mapToDomain(row: any): ServiceType {
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

  private mapToDomainWithCategories(row: any): ServiceTypeWithCategories {
    const serviceType = this.mapToDomain(row);
    
    const categories = (row.service_type_category || [])
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
      ...serviceType,
      categories,
    };
  }

  private handleError(error: unknown, context: string): never {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[SupabaseServiceTypeRepository][${context}] Error:`, error);
    throw new Error(`Database error in ${context}: ${message}`);
  }
}

export const serviceTypeRepo = new SupabaseServiceTypeRepository();
