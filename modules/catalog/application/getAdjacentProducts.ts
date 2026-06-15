import { ProductWithRelations } from "../domain";
import { ProductRepository } from "../domain/repository";
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
 * Lay san pham lien truoc / lien sau trong cung nhom de hien thi pager dieu huong.
 *
 * Nhom uu tien theo loai san pham (category). Neu nhom cung loai khong du de
 * dieu huong thi gom toan bo san pham da xuat ban. Thu tu sap xep dong nhat voi
 * trang danh sach: san pham noi bat len dau, sau do theo orderIndex.
 */
export const getAdjacentProducts = async (
  productRepo: ProductRepository,
  product: Pick<ProductWithRelations, "id" | "categoryId">,
): Promise<AdjacentProducts> => {
  // Uu tien cac san pham cung loai.
  let siblings = await getProducts(productRepo, {
    isPublished: true,
    categoryId: product.categoryId || undefined,
  });

  // Fallback: gom toan bo san pham da xuat ban neu nhom cung loai qua it.
  if (siblings.length < 2) {
    siblings = await getProducts(productRepo, { isPublished: true });
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
