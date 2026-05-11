import { Category } from "../domain/types";
import { categoryRepo } from "../infrastructure/categoryRepo";

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  return categoryRepo.getBySlug(slug);
}

/**
 * Get category by slug and all its descendant IDs (useful for filtering products)
 */
export async function getCategoryIdsBySlug(slug: string): Promise<string[]> {
  const matched = await categoryRepo.getBySlug(slug);
  if (!matched) return [];

  const categoryIds: string[] = [matched.id];
  
  // Recursive function to get all children IDs
  async function fetchChildrenRecursively(parentId: string) {
    const children = await categoryRepo.getChildren(parentId);
    for (const child of children) {
      categoryIds.push(child.id);
      await fetchChildrenRecursively(child.id);
    }
  }

  await fetchChildrenRecursively(matched.id);
  return categoryIds;
}
