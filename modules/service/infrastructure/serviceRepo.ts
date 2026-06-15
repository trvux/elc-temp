import { createClient } from "@/shared/lib/supabase/server";
import { Database } from "@/database.types";
import {
  Service,
  ServiceWithRelations,
  CreateServiceInput,
  UpdateServiceInput,
  ServiceFilter,
} from "../domain/types";
import { ServiceRepository } from "../domain/repository";
import { ServiceGroup } from "@/modules/service-group/domain/types";
import { CategoryWithGroup } from "@/modules/category/domain/types";

type Tables = Database["public"]["Tables"];
type ServiceRow = Tables["services"]["Row"];
type ServiceInsert = Tables["services"]["Insert"];
type ServiceUpdate = Tables["services"]["Update"];

interface ServiceQueryRow {
  id: string;
  title: string;
  slug: string;
  group_id: string | null;
  category_id: string | null;
  original_price: number | null;
  sale_price: number | null;
  discount_percent: number | null;
  price_display_text: string | null;
  labels: string[] | null;
  description: string | null;
  content: unknown;
  image: string | null;
  meta_title: string | null;
  meta_description: string | null;
  is_featured: boolean | null;
  is_published: boolean | null;
  order_index: number | null;
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
  group: {
    id: string;
    name: string;
    slug: string;
    image_url: string | null;
    meta_title: string | null;
    meta_description: string | null;
    is_featured: boolean | null;
    order_index: number | null;
    created_at: string | null;
    updated_at: string | null;
    deleted_at: string | null;
  } | null;
  category: {
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
    group: {
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
    } | null;
  } | null;
}

export class SupabaseServiceRepository implements ServiceRepository {
  private readonly TABLE_NAME = "services";

  private mapToEntity(row: ServiceRow): Service {
    return {
      id: row.id,
      title: row.title,
      slug: row.slug,
      groupId: row.group_id,
      categoryId: row.category_id,
      originalPrice: row.original_price,
      salePrice: row.sale_price,
      discountPercent: row.discount_percent,
      priceDisplayText: row.price_display_text,
      labels: row.labels,
      description: row.description,
      content: row.content,
      image: row.image,
      metaTitle: row.meta_title,
      metaDescription: row.meta_description,
      isFeatured: row.is_featured || false,
      isPublished: row.is_published ?? true,
      orderIndex: row.order_index || 0,
      createdAt: row.created_at || new Date().toISOString(),
      updatedAt: row.updated_at || new Date().toISOString(),
      deletedAt: row.deleted_at,
    };
  }

  async count(options?: ServiceFilter): Promise<number> {
    const supabase = await createClient();
    let query = supabase
      .from(this.TABLE_NAME)
      .select("*", { count: "exact", head: true });

    if (!options?.includeDeleted) {
      query = query.is("deleted_at", null);
    }
    
    if (options?.groupId) {
      query = query.eq("group_id", options.groupId);
    }

    if (options?.categoryId) {
      query = query.eq("category_id", options.categoryId);
    }

    if (options?.isFeatured !== undefined) {
      query = query.eq("is_featured", options.isFeatured);
    }

    if (options?.isPublished !== undefined) {
      query = query.eq("is_published", options.isPublished);
    }

    if (options?.search) {
      query = query.ilike("title", `%${options.search}%`);
    }

    const { count, error } = await query;
    if (error) throw error;
    return count || 0;
  }

  async getAll(options?: ServiceFilter): Promise<ServiceWithRelations[]> {
    const supabase = await createClient();
    
    let query = supabase.from(this.TABLE_NAME).select(`
      *,
      group:service_groups(*),
      category:categories(
        *,
        group:group_categories(*)
      )
    `);

    if (!options?.includeDeleted) {
      query = query.is("deleted_at", null);
    }
    
    if (options?.groupId) {
      query = query.eq("group_id", options.groupId);
    }

    if (options?.categoryId) {
      query = query.eq("category_id", options.categoryId);
    }

    if (options?.isFeatured !== undefined) {
      query = query.eq("is_featured", options.isFeatured);
    }

    if (options?.isPublished !== undefined) {
      query = query.eq("is_published", options.isPublished);
    }

    if (options?.search) {
      query = query.ilike("title", `%${options.search}%`);
    }

    query = query.order("order_index", { ascending: true }).order("created_at", { ascending: false });

    const { data, error } = await query;

    if (error) throw error;
    if (!data) return [];

    return (data as unknown as ServiceQueryRow[]).map((row) => {
      const entity = this.mapToEntity(row as unknown as ServiceRow);
      
      let mappedGroup: ServiceGroup | null = null;
      if (row.group) {
        mappedGroup = {
          id: row.group.id,
          name: row.group.name,
          slug: row.group.slug,
          imageUrl: row.group.image_url,
          metaTitle: row.group.meta_title,
          metaDescription: row.group.meta_description,
          isFeatured: row.group.is_featured || false,
          orderIndex: row.group.order_index || 0,
          createdAt: row.group.created_at || new Date().toISOString(),
          updatedAt: row.group.updated_at || new Date().toISOString(),
          deletedAt: row.group.deleted_at,
        };
      }

      let mappedCategory: CategoryWithGroup | null = null;
      if (row.category) {
        mappedCategory = {
          id: row.category.id,
          name: row.category.name,
          groupId: row.category.group_id,
          slug: row.category.slug || "",
          imageUrl: row.category.image_url,
          metaTitle: row.category.meta_title,
          metaDescription: row.category.meta_description,
          isFeatured: row.category.is_featured || false,
          orderIndex: row.category.order_index || 0,
          createdAt: row.category.created_at || new Date().toISOString(),
          updatedAt: row.category.updated_at || new Date().toISOString(),
          deletedAt: row.category.deleted_at,
          group: row.category.group ? {
            id: row.category.group.id,
            name: row.category.group.name,
            slug: row.category.group.slug || "",
            imageUrl: row.category.group.image_url,
            metaTitle: row.category.group.meta_title,
            metaDescription: row.category.group.meta_description,
            isFeatured: row.category.group.is_featured || false,
            orderIndex: row.category.group.order_index || 0,
            createdAt: row.category.group.created_at || new Date().toISOString(),
            updatedAt: row.category.group.updated_at || new Date().toISOString(),
            deletedAt: row.category.group.deleted_at,
          } : null
        };
      }

      return {
        ...entity,
        group: mappedGroup,
        category: mappedCategory
      };
    });
  }

  async getById(id: string): Promise<ServiceWithRelations | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .select(`
        *,
        group:service_groups(*),
        category:categories(
          *,
          group:group_categories(*)
        )
      `)
      .eq("id", id)
      .is("deleted_at", null)
      .single();

    if (error || !data) return null;
    
    const row = data as unknown as ServiceQueryRow;
    const entity = this.mapToEntity(row as unknown as ServiceRow);
      
    let mappedGroup: ServiceGroup | null = null;
    if (row.group) {
      mappedGroup = {
        id: row.group.id,
        name: row.group.name,
        slug: row.group.slug,
        imageUrl: row.group.image_url,
        metaTitle: row.group.meta_title,
        metaDescription: row.group.meta_description,
        isFeatured: row.group.is_featured || false,
        orderIndex: row.group.order_index || 0,
        createdAt: row.group.created_at || new Date().toISOString(),
        updatedAt: row.group.updated_at || new Date().toISOString(),
        deletedAt: row.group.deleted_at,
      };
    }

    let mappedCategory: CategoryWithGroup | null = null;
    if (row.category) {
      mappedCategory = {
        id: row.category.id,
        name: row.category.name,
        groupId: row.category.group_id,
        slug: row.category.slug || "",
        imageUrl: row.category.image_url,
        metaTitle: row.category.meta_title,
        metaDescription: row.category.meta_description,
        isFeatured: row.category.is_featured || false,
        orderIndex: row.category.order_index || 0,
        createdAt: row.category.created_at || new Date().toISOString(),
        updatedAt: row.category.updated_at || new Date().toISOString(),
        deletedAt: row.category.deleted_at,
        group: row.category.group ? {
          id: row.category.group.id,
          name: row.category.group.name,
          slug: row.category.group.slug || "",
          imageUrl: row.category.group.image_url,
          metaTitle: row.category.group.meta_title,
          metaDescription: row.category.group.meta_description,
          isFeatured: row.category.group.is_featured || false,
          orderIndex: row.category.group.order_index || 0,
          createdAt: row.category.group.created_at || new Date().toISOString(),
          updatedAt: row.category.group.updated_at || new Date().toISOString(),
          deletedAt: row.category.group.deleted_at,
        } : null
      };
    }

    return {
      ...entity,
      group: mappedGroup,
      category: mappedCategory
    };
  }

  async getBySlug(slug: string): Promise<ServiceWithRelations | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .select(`
        *,
        group:service_groups(*),
        category:categories(
          *,
          group:group_categories(*)
        )
      `)
      .eq("slug", slug)
      .is("deleted_at", null)
      .single();

    if (error || !data) return null;
    // ... we map same as getById, so we can extract mapping to a helper if we wanted
    const row = data as unknown as ServiceQueryRow;
    const entity = this.mapToEntity(row as unknown as ServiceRow);
      
    let mappedGroup: ServiceGroup | null = null;
    if (row.group) {
      mappedGroup = {
        id: row.group.id,
        name: row.group.name,
        slug: row.group.slug,
        imageUrl: row.group.image_url,
        metaTitle: row.group.meta_title,
        metaDescription: row.group.meta_description,
        isFeatured: row.group.is_featured || false,
        orderIndex: row.group.order_index || 0,
        createdAt: row.group.created_at || new Date().toISOString(),
        updatedAt: row.group.updated_at || new Date().toISOString(),
        deletedAt: row.group.deleted_at,
      };
    }

    let mappedCategory: CategoryWithGroup | null = null;
    if (row.category) {
      mappedCategory = {
        id: row.category.id,
        name: row.category.name,
        groupId: row.category.group_id,
        slug: row.category.slug || "",
        imageUrl: row.category.image_url,
        metaTitle: row.category.meta_title,
        metaDescription: row.category.meta_description,
        isFeatured: row.category.is_featured || false,
        orderIndex: row.category.order_index || 0,
        createdAt: row.category.created_at || new Date().toISOString(),
        updatedAt: row.category.updated_at || new Date().toISOString(),
        deletedAt: row.category.deleted_at,
        group: row.category.group ? {
          id: row.category.group.id,
          name: row.category.group.name,
          slug: row.category.group.slug || "",
          imageUrl: row.category.group.image_url,
          metaTitle: row.category.group.meta_title,
          metaDescription: row.category.group.meta_description,
          isFeatured: row.category.group.is_featured || false,
          orderIndex: row.category.group.order_index || 0,
          createdAt: row.category.group.created_at || new Date().toISOString(),
          updatedAt: row.category.group.updated_at || new Date().toISOString(),
          deletedAt: row.category.group.deleted_at,
        } : null
      };
    }

    return {
      ...entity,
      group: mappedGroup,
      category: mappedCategory
    };
  }

  async create(input: CreateServiceInput): Promise<Service> {
    const supabase = await createClient();
    
    // Check if there is an existing soft-deleted service with the same slug
    const { data: existing, error: findError } = await supabase
      .from(this.TABLE_NAME)
      .select("*")
      .eq("slug", input.slug)
      .not("deleted_at", "is", null)
      .maybeSingle();

    if (findError) throw findError;

    // Auto calculate sale price if original price and discount exist
    let salePrice = input.salePrice;
    if (input.originalPrice && input.discountPercent) {
      salePrice = input.originalPrice - Math.round(input.originalPrice * (input.discountPercent / 100));
    }

    if (existing) {
      const updateData: ServiceUpdate = {
        title: input.title,
        slug: input.slug,
        group_id: input.groupId,
        category_id: input.categoryId,
        original_price: input.originalPrice,
        sale_price: salePrice,
        discount_percent: input.discountPercent,
        price_display_text: input.priceDisplayText,
        labels: input.labels,
        description: input.description,
        content: input.content,
        image: input.image,
        meta_title: input.metaTitle,
        meta_description: input.metaDescription,
        is_featured: input.isFeatured,
        is_published: input.isPublished,
        order_index: input.orderIndex,
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
      return this.mapToEntity(data as ServiceRow);
    } else {
      const insertData: ServiceInsert = {
        title: input.title,
        slug: input.slug,
        group_id: input.groupId,
        category_id: input.categoryId,
        original_price: input.originalPrice,
        sale_price: salePrice,
        discount_percent: input.discountPercent,
        price_display_text: input.priceDisplayText,
        labels: input.labels,
        description: input.description,
        content: input.content,
        image: input.image,
        meta_title: input.metaTitle,
        meta_description: input.metaDescription,
        is_featured: input.isFeatured,
        is_published: input.isPublished,
        order_index: input.orderIndex,
      };

      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return this.mapToEntity(data as ServiceRow);
    }
  }

  async update(input: UpdateServiceInput): Promise<Service> {
    const supabase = await createClient();
    
    const updateData: ServiceUpdate = {
      updated_at: new Date().toISOString(),
    };

    if (input.title !== undefined) updateData.title = input.title;
    if (input.slug !== undefined) updateData.slug = input.slug;
    if (input.groupId !== undefined) updateData.group_id = input.groupId;
    if (input.categoryId !== undefined) updateData.category_id = input.categoryId;
    
    // Handle price recalculation
    if (input.originalPrice !== undefined) updateData.original_price = input.originalPrice;
    if (input.discountPercent !== undefined) updateData.discount_percent = input.discountPercent;
    if (input.salePrice !== undefined) {
      updateData.sale_price = input.salePrice;
    } else if (input.originalPrice !== undefined && input.discountPercent !== undefined && input.originalPrice && input.discountPercent) {
      updateData.sale_price = input.originalPrice - Math.round(input.originalPrice * (input.discountPercent / 100));
    } else if (input.originalPrice !== undefined && input.discountPercent === undefined) {
      // If we just updated original price but not discount, we'd need current discount from DB to recalculate properly, 
      // but usually the admin form sends both anyway.
    }

    if (input.priceDisplayText !== undefined) updateData.price_display_text = input.priceDisplayText;
    if (input.labels !== undefined) updateData.labels = input.labels;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.content !== undefined) updateData.content = input.content;
    if (input.image !== undefined) updateData.image = input.image;
    if (input.metaTitle !== undefined) updateData.meta_title = input.metaTitle;
    if (input.metaDescription !== undefined) updateData.meta_description = input.metaDescription;
    if (input.isFeatured !== undefined) updateData.is_featured = input.isFeatured;
    if (input.isPublished !== undefined) updateData.is_published = input.isPublished;
    if (input.orderIndex !== undefined) updateData.order_index = input.orderIndex;

    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .update(updateData)
      .eq("id", input.id)
      .select()
      .single();

    if (error) throw error;
    return this.mapToEntity(data as ServiceRow);
  }

  async softDelete(id: string): Promise<void> {
    const supabase = await createClient();
    
    // 1. Set deleted_at for the service
    const { error } = await supabase
      .from(this.TABLE_NAME)
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw error;
    
    // 2. Delete relations in project_service for this service
    await supabase
      .from("project_service")
      .delete()
      .eq("service_id", id);
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

export const serviceRepo = new SupabaseServiceRepository();
