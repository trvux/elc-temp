import { createClient } from "@/shared/lib/supabase/server";
import { Database } from "@/database.types";
import {
  ServiceGroup,
  CreateServiceGroupInput,
  UpdateServiceGroupInput,
} from "../domain/types";

type Tables = Database["public"]["Tables"];
type ServiceGroupRow = Tables["service_groups"]["Row"];
type ServiceGroupInsert = Tables["service_groups"]["Insert"];
type ServiceGroupUpdate = Tables["service_groups"]["Update"];

class ServiceGroupRepository {
  private readonly TABLE_NAME = "service_groups";

  private mapToEntity(row: ServiceGroupRow): ServiceGroup {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      imageUrl: row.image_url,
      metaTitle: row.meta_title,
      metaDescription: row.meta_description,
      isFeatured: row.is_featured || false,
      orderIndex: row.order_index || 0,
      categoryIds: row.category_ids,
      createdAt: row.created_at || new Date().toISOString(),
      updatedAt: row.updated_at || new Date().toISOString(),
      deletedAt: row.deleted_at,
    };
  }

  async getAll(options?: { includeDeleted?: boolean; isFeatured?: boolean }): Promise<ServiceGroup[]> {
    const supabase = await createClient();
    let query = supabase.from(this.TABLE_NAME).select("*");

    if (!options?.includeDeleted) {
      query = query.is("deleted_at", null);
    }
    
    if (options?.isFeatured !== undefined) {
      query = query.eq("is_featured", options.isFeatured);
    }

    query = query.order("order_index", { ascending: true }).order("created_at", { ascending: false });

    const { data, error } = await query;

    if (error) throw error;
    if (!data) return [];

    return data.map((row) => this.mapToEntity(row as ServiceGroupRow));
  }

  async getById(id: string): Promise<ServiceGroup | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .select("*")
      .eq("id", id)
      .is("deleted_at", null)
      .single();

    if (error || !data) return null;
    return this.mapToEntity(data as ServiceGroupRow);
  }

  async getBySlug(slug: string): Promise<ServiceGroup | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .select("*")
      .eq("slug", slug)
      .is("deleted_at", null)
      .single();

    if (error || !data) return null;
    return this.mapToEntity(data as ServiceGroupRow);
  }

  async create(input: CreateServiceGroupInput): Promise<ServiceGroup> {
    const supabase = await createClient();
    
    // Check if there is an existing soft-deleted service group with the same slug
    const { data: existing, error: findError } = await supabase
      .from(this.TABLE_NAME)
      .select("*")
      .eq("slug", input.slug)
      .not("deleted_at", "is", null)
      .maybeSingle();

    if (findError) throw findError;

    if (existing) {
      const updateData: ServiceGroupUpdate = {
        name: input.name,
        slug: input.slug,
        image_url: input.imageUrl,
        meta_title: input.metaTitle,
        meta_description: input.metaDescription,
        is_featured: input.isFeatured,
        order_index: input.orderIndex,
        category_ids: input.categoryIds,
        deleted_at: null,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .update(updateData)
        .eq("id", existing.id)
        .select()
        .single();

      if (error) throw error;
      return this.mapToEntity(data as ServiceGroupRow);
    } else {
      const insertData: ServiceGroupInsert = {
        name: input.name,
        slug: input.slug,
        image_url: input.imageUrl,
        meta_title: input.metaTitle,
        meta_description: input.metaDescription,
        is_featured: input.isFeatured,
        order_index: input.orderIndex,
        category_ids: input.categoryIds,
      };

      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return this.mapToEntity(data as ServiceGroupRow);
    }
  }

  async update(input: UpdateServiceGroupInput): Promise<ServiceGroup> {
    const supabase = await createClient();
    
    const updateData: ServiceGroupUpdate = {
      updated_at: new Date().toISOString(),
    };

    if (input.name !== undefined) updateData.name = input.name;
    if (input.slug !== undefined) updateData.slug = input.slug;
    if (input.imageUrl !== undefined) updateData.image_url = input.imageUrl;
    if (input.metaTitle !== undefined) updateData.meta_title = input.metaTitle;
    if (input.metaDescription !== undefined) updateData.meta_description = input.metaDescription;
    if (input.isFeatured !== undefined) updateData.is_featured = input.isFeatured;
    if (input.orderIndex !== undefined) updateData.order_index = input.orderIndex;
    if (input.categoryIds !== undefined) updateData.category_ids = input.categoryIds;

    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .update(updateData)
      .eq("id", input.id)
      .select()
      .single();

    if (error) throw error;
    return this.mapToEntity(data as ServiceGroupRow);
  }

  async softDelete(id: string): Promise<void> {
    const supabase = await createClient();
    
    // 1. Set deleted_at for the group
    const { error: groupError } = await supabase
      .from(this.TABLE_NAME)
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);

    if (groupError) throw groupError;
    
    // 2. Set group_id = null for services that belonged to this group
    await supabase
      .from("services")
      .update({ group_id: null })
      .eq("group_id", id);
  }

  async restore(id: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
      .from(this.TABLE_NAME)
      .update({ deleted_at: null })
      .eq("id", id);

    if (error) throw error;
  }
}

export const serviceGroupRepo = new ServiceGroupRepository();
