import { Group } from "@/modules/group/domain/types";
import { getGroupByIdAction } from "@/modules/group/presentation/actions";
import { CategoryWithGroup } from "@/modules/category/domain/types";
import { getCategoryByIdAction } from "@/modules/category/presentation/actions";
import { Brand, ProductWithRelations } from "@/modules/catalog/domain/types";
import { getBrandByIdAction } from "@/modules/brand/presentation/actions";
import { getProductByIdAction } from "./actions";
import { getSlugRegistryEntry } from "@/shared/lib/go-api";
import { cacheLife, cacheTag } from "next/cache";

export type ResolvedEntity =
  | { type: "group"; data: Group }
  | { type: "category"; data: CategoryWithGroup }
  | { type: "brand"; data: Brand }
  | { type: "product"; data: ProductWithRelations }
  | null;

/**
 * Tra cuu loai thuc the tu slug_registry (qua Go API), roi dispatch sang
 * action Go-backed tuong ung cua tung entity.
 */
export async function resolveProductPathFromDb(slug: string): Promise<ResolvedEntity> {
  "use cache";
  cacheLife("days");
  cacheTag(`slug:${slug}`);

  const registryItem = await getSlugRegistryEntry(slug);
  if (!registryItem) {
    return null;
  }

  switch (registryItem.entityType) {
    case "group": {
      const { data } = await getGroupByIdAction(registryItem.entityId);
      return data ? { type: "group", data } : null;
    }

    case "category":
    case "categories": {
      const { data } = await getCategoryByIdAction(registryItem.entityId);
      return data ? { type: "category", data } : null;
    }

    case "brand": {
      const { data } = await getBrandByIdAction(registryItem.entityId);
      return data ? { type: "brand", data } : null;
    }

    case "product": {
      const { data: product } = await getProductByIdAction(registryItem.entityId);
      return product ? { type: "product", data: product } : null;
    }

    default:
      return null;
  }
}
