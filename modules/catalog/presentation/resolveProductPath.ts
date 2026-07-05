import { createClient, setUseStaticClient } from "@/shared/lib/supabase/server";
import { Group } from "@/modules/group/domain/types";
import { CategoryWithGroup } from "@/modules/category/domain/types";
import { getCategoryByIdAction } from "@/modules/category/presentation/actions";
import { Brand, ProductWithRelations } from "@/modules/catalog/domain/types";
import { getProductByIdAction } from "./actions";
import { cacheLife, cacheTag } from "next/cache";

export type ResolvedEntity =
  | { type: "group"; data: Group }
  | { type: "category"; data: CategoryWithGroup }
  | { type: "brand"; data: Brand }
  | { type: "product"; data: ProductWithRelations }
  | null;

/**
 * Tra cuu loai thuc the tu slug_registry.
 *
 * group/brand van doc truc tiep tu Supabase (cac module do chua migrate sang Go
 * trong dot nay) — day la orchestration cross-entity o phia Next.js, khong phai
 * trach nhiem cua catalog module. Nhanh "category"/"product" goi qua Go API bang
 * getCategoryByIdAction/getProductByIdAction thay vi doc truc tiep Supabase.
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
      const { data } = await getCategoryByIdAction(registryItem.entity_id);
      return data ? { type: "category", data } : null;
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
      const { data: product } = await getProductByIdAction(registryItem.entity_id);
      return product ? { type: "product", data: product } : null;
    }

    default:
      return null;
  }
}
