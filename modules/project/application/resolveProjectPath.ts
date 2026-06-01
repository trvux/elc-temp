import { createClient, setUseStaticClient } from "@/shared/lib/supabase/server";
import { ProjectWithCategory, Json } from "@/modules/project/domain/types";
import { ServiceTypeWithCategories } from "@/modules/service-type/domain/types";
import { cacheLife } from "next/cache";

export type ResolvedProjectEntity =
  | { type: "service_type"; data: ServiceTypeWithCategories }
  | { type: "project"; data: ProjectWithCategory }
  | null;

export async function resolveProjectPath(slug: string): Promise<ResolvedProjectEntity> {
  "use cache";
  cacheLife("hours");
  setUseStaticClient(true);

  const supabase = await createClient();

  const { data: registryItemRow, error: registryError } = await supabase
    .from("slug_registry")
    .select("entity_type, entity_id")
    .eq("slug", slug)
    .is("deleted_at", null)
    .maybeSingle();

  const registryItem = registryItemRow as { entity_type: string; entity_id: string } | null;

  if (registryError || !registryItem) {
    return null;
  }

  if (registryItem.entity_type === "service_type") {
    const { data: serviceTypeRow, error: serviceTypeError } = await supabase
      .from("service_type")
      .select(`
        *,
        service_type_category(
          categories(
            *,
            group_categories(*)
          )
        )
      `)
      .eq("id", registryItem.entity_id)
      .is("deleted_at", null)
      .maybeSingle();

    if (serviceTypeError || !serviceTypeRow) {
      return null;
    }

    const row = serviceTypeRow as {
      id: string;
      name: string;
      slug: string;
      image: string | null;
      meta_title: string | null;
      meta_description: string | null;
      is_featured: boolean;
      order_index: number;
      created_at: string;
      updated_at: string;
      deleted_at: string | null;
      service_type_category: {
        categories: {
          id: string;
          name: string;
          group_id: string | null;
          slug: string;
          image_url: string | null;
          meta_title: string | null;
          meta_description: string | null;
          is_featured: boolean;
          order_index: number;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
          group_categories: {
            id: string;
            name: string;
            slug: string;
            image_url: string | null;
            meta_title: string | null;
            meta_description: string | null;
            is_featured: boolean;
            order_index: number;
            created_at: string;
            updated_at: string;
            deleted_at: string | null;
          } | null;
        } | null;
      }[] | null;
    };

    const categories = (row.service_type_category || [])
      .map((stc) => {
        const cat = stc.categories;
        if (!cat || cat.deleted_at) return null;
        return {
          id: cat.id,
          name: cat.name,
          groupId: cat.group_id,
          slug: cat.slug || "",
          imageUrl: cat.image_url,
          metaTitle: cat.meta_title,
          metaDescription: cat.meta_description,
          isFeatured: cat.is_featured || false,
          orderIndex: cat.order_index || 0,
          createdAt: cat.created_at,
          updatedAt: cat.updated_at,
          deletedAt: cat.deleted_at,
          group: cat.group_categories
            ? {
                id: cat.group_categories.id,
                name: cat.group_categories.name,
                slug: cat.group_categories.slug || "",
                imageUrl: cat.group_categories.image_url,
                metaTitle: cat.group_categories.meta_title,
                metaDescription: cat.group_categories.meta_description,
                isFeatured: cat.group_categories.is_featured || false,
                orderIndex: cat.group_categories.order_index || 0,
                createdAt: cat.group_categories.created_at,
                updatedAt: cat.group_categories.updated_at,
                deletedAt: cat.group_categories.deleted_at,
              }
            : null,
        };
      })
      .filter((c): c is NonNullable<typeof c> => c !== null);

    const serviceType: ServiceTypeWithCategories = {
      id: row.id,
      name: row.name,
      slug: row.slug || "",
      image: row.image,
      metaTitle: row.meta_title,
      metaDescription: row.meta_description,
      isFeatured: row.is_featured || false,
      orderIndex: row.order_index || 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at,
      categories,
    };

    return { type: "service_type", data: serviceType };
  }

  if (registryItem.entity_type === "project") {
    const { data: projectRow, error: projectError } = await supabase
      .from("projects")
      .select(`
        *,
        serviceType:service_type(id, name, slug),
        project_category(
          categoryNew:categories(
            *,
            group_categories(*)
          )
        )
      `)
      .eq("id", registryItem.entity_id)
      .is("deleted_at", null)
      .maybeSingle();

    if (projectError || !projectRow) {
      return null;
    }

    const row = projectRow as {
      id: string;
      title: string;
      slug: string;
      description: string | Record<string, unknown> | null;
      images: string[];
      is_featured: boolean;
      is_published: boolean;
      meta_title: string | null;
      meta_description: string | null;
      order_index: number;
      category_id: string;
      service_type_id: string | null;
      created_at: string;
      updated_at: string;
      deleted_at: string | null;
      serviceType: {
        id: string;
        name: string;
        slug: string;
      } | null;
      project_category: {
        categoryNew: {
          id: string;
          name: string;
          group_id: string | null;
          group_categories: {
            id: string;
            name: string;
          } | null;
        } | null;
      }[] | null;
    };

    const categoriesNew = (row.project_category || [])
      .map((pc) => {
        const cat = pc.categoryNew;
        if (!cat) return null;
        return {
          id: cat.id,
          name: cat.name,
          groupId: cat.group_id,
          group: cat.group_categories
            ? {
                id: cat.group_categories.id,
                name: cat.group_categories.name,
              }
            : null,
        };
      })
      .filter((c): c is NonNullable<typeof c> => c !== null);

    const project: ProjectWithCategory = {
      id: row.id,
      title: row.title,
      slug: row.slug || "",
      description: (row.description as Json) || null,
      images: row.images || [],
      isFeatured: row.is_featured || false,
      isPublished: row.is_published || false,
      metaTitle: row.meta_title,
      metaDescription: row.meta_description,
      orderIndex: row.order_index || 0,
      categoryId: row.category_id || "",
      serviceTypeId: row.service_type_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at,
      category: null,
      serviceType: row.serviceType
        ? {
            id: row.serviceType.id,
            name: row.serviceType.name,
            slug: row.serviceType.slug,
          }
        : null,
      categoriesNew,
    };

    return { type: "project", data: project };
  }

  return null;
}
