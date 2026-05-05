import { Category } from "../domain/types";
import { categoryRepo } from "../infrastructure/categoryRepo";

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  return categoryRepo.getBySlug(slug);
}

/**
 * Get category by slug and its children IDs (useful for filtering products)
 */
export async function getCategoryIdsBySlug(slug: string): Promise<string[]> {
  const matched = await categoryRepo.getBySlug(slug);
  
  if (!matched) return [];
  
  const categoryIds = [matched.id];
  const children = await categoryRepo.getChildren(matched.id);
  categoryIds.push(...children.map((c) => c.id));
  
  return categoryIds;
}
