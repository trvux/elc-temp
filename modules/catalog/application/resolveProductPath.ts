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

export async function resolveProductPath(slug: string): Promise<ResolvedEntity> {
  "use cache";
  cacheLife("days");
  cacheTag(`slug:${slug}`);
  setUseStaticClient(true);

  const supabase = await createClient();

  // 1. Tra cứu slug_registry để xem slug này thuộc về loại entity nào
  const { data: registryItemRow, error: registryError } = await supabase
    .from("slug_registry")
    .select("entity_type, entity_id")
    .eq("slug", slug)
    .is("deleted_at", null)
    .single();

  const registryItem = registryItemRow as { entity_type: string; entity_id: string } | null;

  if (registryError || !registryItem) {
    return null; // Slug không tồn tại hoặc lỗi (ví dụ: bị xóa)
  }

  // 2. Tùy thuộc vào entity_type, fetch chi tiết từ bảng tương ứng
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
        .select("*")
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
