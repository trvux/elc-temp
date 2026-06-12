import { createClient, setUseStaticClient } from "@/shared/lib/supabase/server";
import { ProjectWithCategory, Json } from "@/modules/project/domain/types";
import { ProjectTypeWithCategories } from "@/modules/project-type/domain/types";
import { cacheLife, cacheTag } from "next/cache";

export type ResolvedProjectEntity =
  | { type: "project_type"; data: ProjectTypeWithCategories }
  | { type: "project"; data: ProjectWithCategory }
  | null;

export async function resolveProjectPath(slug: string): Promise<ResolvedProjectEntity> {
  "use cache";
  cacheLife("days");
  cacheTag("projects", `slug:${slug}`);
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

  if (registryItem.entity_type === "project_type") {
    const { data: projectTypeRow, error: projectTypeError } = await supabase
      .from("project_type")
      .select(`
        *,
        project_type_category(
          categories(
            *,
            group_categories(*)
          )
        )
      `)
      .eq("id", registryItem.entity_id)
      .is("deleted_at", null)
      .maybeSingle();

    if (projectTypeError || !projectTypeRow) {
      return null;
    }

    const row = projectTypeRow as {
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
      project_type_category: {
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

    const categories = (row.project_type_category || [])
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

    const projectType: ProjectTypeWithCategories = {
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

    return { type: "project_type", data: projectType };
  }

  if (registryItem.entity_type === "project") {
    const { data: projectRow, error: projectError } = await supabase
      .from("projects")
      .select(`
        *,
        projectType:project_type(id, name, slug),
        project_category(
          condition,
          category:categories(
            *,
            group_categories(*),
            products(sale_price, original_price, is_published, deleted_at)
          )
        ),
        project_service(
          service:services(id, title, slug, group:service_groups(id, name, slug))
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
      project_type_id: string | null;
      created_at: string;
      updated_at: string;
      deleted_at: string | null;
      projectType: {
        id: string;
        name: string;
        slug: string;
      } | null;
      project_category: {
        condition: "new" | "used";
        category: {
          id: string;
          name: string;
          slug: string | null;
          group_id: string | null;
          group_categories: {
            id: string;
            name: string;
          } | null;
          products: {
            sale_price: number;
            original_price: number;
            is_published: boolean;
            deleted_at: string | null;
          }[] | null;
        } | null;
      }[] | null;
      project_service: {
        service: {
          id: string;
          title: string;
          slug: string;
          group: {
            id: string;
            name: string;
            slug: string;
          } | null;
        } | null;
      }[] | null;
    };

    const categories = (row.project_category || [])
      .map((pc) => {
        const cat = pc.category;
        if (!cat) return null;

        const catProducts = (cat.products || [])
          .filter((p) => p.is_published && !p.deleted_at);

        const prices = catProducts
          .map((p) => p.sale_price || p.original_price || 0)
          .filter((p) => p > 0);

        const lowPrice = prices.length > 0 ? Math.min(...prices) : 0;
        const highPrice = prices.length > 0 ? Math.max(...prices) : 0;
        const offerCount = prices.length;

        return {
          id: cat.id,
          name: cat.name,
          slug: cat.slug || "",
          groupId: cat.group_id,
          condition: pc.condition || "new",
          group: cat.group_categories
            ? {
                id: cat.group_categories.id,
                name: cat.group_categories.name,
              }
            : null,
          lowPrice,
          highPrice,
          offerCount,
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
          group: svc.group
            ? {
                id: svc.group.id,
                name: svc.group.name,
                slug: svc.group.slug || "",
              }
            : null,
        };
      })
      .filter((s): s is NonNullable<typeof s> => s !== null);

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
      projectTypeId: row.project_type_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at,
      category: null,
      projectType: row.projectType
        ? {
            id: row.projectType.id,
            name: row.projectType.name,
            slug: row.projectType.slug,
          }
        : null,
      services,
      categories,
    };

    return { type: "project", data: project };
  }

  return null;
}
