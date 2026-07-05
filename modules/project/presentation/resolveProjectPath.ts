import { createClient, setUseStaticClient } from "@/shared/lib/supabase/server";
import { ProjectWithCategory } from "@/modules/project/domain/types";
import { ProjectTypeWithCategories } from "@/modules/project-type/domain/types";
import { cacheLife, cacheTag } from "next/cache";
import { resolveProjectDetailAction } from "./actions";

export type ResolvedProjectEntity =
  | { type: "project_type"; data: ProjectTypeWithCategories }
  | { type: "project"; data: ProjectWithCategory }
  | null;

/**
 * Tra cuu loai thuc the (project_type hoac project) tu slug_registry.
 *
 * `project_type` van truy van Supabase truc tiep (module project-type chua
 * migrate sang Go). Nhanh `project` da chuyen sang goi Go qua
 * resolveProjectDetailAction (xem docs/project.md) — day la ham duy nhat
 * con lai cua modules/project sau khi cutover con truy van Supabase truc
 * tiep, vi no phai xu ly ca 2 loai thuc the trong cung 1 lookup slug_registry.
 */
export async function resolveProjectPathFromDb(slug: string): Promise<ResolvedProjectEntity> {
  "use cache";
  cacheLife("days");
  cacheTag(`slug:${slug}`);
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
    const { data: project, error } = await resolveProjectDetailAction(slug);
    if (error || !project) {
      return null;
    }
    return { type: "project", data: project };
  }

  return null;
}
