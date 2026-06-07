import { getGroups } from "@/modules/group/application";
import { categoryNewRepo } from "../infrastructure/categoryNewRepo";

export interface ProductCategoryNode {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
}

/**
 * Danh sách phẳng danh mục dùng cho bộ lọc sản phẩm phía public.
 *
 * Cấu trúc 2 tầng được biểu diễn bằng `parentId`:
 *  - Nhóm danh mục (group_categories) → `parentId = null` (root)
 *  - Danh mục (categories)            → `parentId = groupId` (con)
 *
 * Thay thế cho `modules/category` (cũ) đã được gỡ bỏ. Cả 2 đều đọc cùng
 * bảng `categories` / `group_categories`, nên kết quả tương đương.
 */
export async function getProductCategories(): Promise<ProductCategoryNode[]> {
  const [groups, categories] = await Promise.all([
    getGroups({ includeDeleted: false }),
    categoryNewRepo.getAll(),
  ]);

  const roots: ProductCategoryNode[] = groups.map((g) => ({
    id: g.id,
    name: g.name,
    slug: g.slug,
    parentId: null,
  }));

  const children: ProductCategoryNode[] = categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    parentId: c.groupId,
  }));

  return [...roots, ...children];
}
