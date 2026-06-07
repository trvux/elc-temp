import { ProductWithRelations } from "../domain";
import { getProducts } from "./getProducts";

export interface AdjacentProduct {
  name: string;
  slug: string;
}

export interface AdjacentProducts {
  prev: AdjacentProduct | null;
  next: AdjacentProduct | null;
}

/**
 * Lấy sản phẩm liền trước / liền sau trong cùng nhóm để hiển thị pager điều hướng.
 *
 * Nhóm ưu tiên theo loại sản phẩm (category). Nếu nhóm cùng loại không đủ để
 * điều hướng thì gom toàn bộ sản phẩm đã xuất bản. Thứ tự sắp xếp đồng nhất với
 * trang danh sách: sản phẩm nổi bật lên đầu, sau đó theo orderIndex.
 */
export const getAdjacentProducts = async (
  product: Pick<ProductWithRelations, "id" | "categoryId">,
): Promise<AdjacentProducts> => {
  // Ưu tiên các sản phẩm cùng loại.
  let siblings = await getProducts({
    isPublished: true,
    categoryId: product.categoryId || undefined,
  });

  // Fallback: gom toàn bộ sản phẩm đã xuất bản nếu nhóm cùng loại quá ít.
  if (siblings.length < 2) {
    siblings = await getProducts({ isPublished: true });
  }

  const sorted = [...siblings].sort((a, b) => {
    if (a.isFeatured && !b.isFeatured) return -1;
    if (!a.isFeatured && b.isFeatured) return 1;
    return a.orderIndex - b.orderIndex;
  });

  const currentIndex = sorted.findIndex((p) => p.id === product.id);
  if (currentIndex === -1 || sorted.length < 2) {
    return { prev: null, next: null };
  }

  const toItem = (p: ProductWithRelations): AdjacentProduct => ({
    name: p.name,
    slug: p.slug || "",
  });

  const prev = currentIndex > 0 ? toItem(sorted[currentIndex - 1]) : null;
  const next =
    currentIndex < sorted.length - 1 ? toItem(sorted[currentIndex + 1]) : null;

  return { prev, next };
};
