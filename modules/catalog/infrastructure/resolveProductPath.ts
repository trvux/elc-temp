import { createClient, setUseStaticClient } from "@/shared/lib/supabase/server";
import { Group } from "@/modules/group/domain/types";
import { Category } from "@/modules/category/domain/types";
import { Brand, ProductWithRelations } from "@/modules/catalog/domain/types";
import { productRepo } from "@/modules/catalog/infrastructure/SupabaseProductRepository";
import { cacheLife, cacheTag } from "next/cache";

export type ResolvedEntity =
  | { type: "group"; data: Group }
  | { type: "category"; data: Category }
  | { type: "brand"; data: Brand }
  | { type: "product"; data: ProductWithRelations }
  | null;

/**
 * Tra cuu loai thuc the tu slug_registry.
 * Ham nay thuoc lop ha tang vi truy cap truc tiep vao Supabase.
 */
export async function resolveProductPathFromDb(slug: string): Promise<ResolvedEntity> {
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
    .single();

  const registryItem = registryItemRow as { entity_type: string; entity_id: string } | null;

  if (registryError || !registryItem) {
    return null;
  }

  switch (registryItem.entity_type) {
    case "group": {
      const { data } = await supabase
        .from("group_categories")
        .select("*")
        .eq("id", registryItem.entity_id)
        .is("deleted_at", null)
        .single();
      return data ? { type: "group", data: data as unknown as Group } : null;
    }

    case "category":
    case "categories": {
      const { data } = await supabase
        .from("categories")
        .select("*, group:group_categories(*)")
        .eq("id", registryItem.entity_id)
        .is("deleted_at", null)
        .single();
      return data ? { type: "category", data: data as unknown as Category } : null;
    }

    case "brand": {
      const { data } = await supabase
        .from("brands")
        .select("*")
        .eq("id", registryItem.entity_id)
        .is("deleted_at", null)
        .single();
      return data ? { type: "brand", data: data as unknown as Brand } : null;
    }

    case "product": {
      const product = await productRepo.getById(registryItem.entity_id);
      return product ? { type: "product", data: product } : null;
    }

    default:
      return null;
  }
}
