import { ProductWithRelations } from "../domain";
import { productRepo } from "../infrastructure/SupabaseProductRepository";

export async function getFeaturedProducts(limit: number = 4): Promise<ProductWithRelations[]> {
  return productRepo.getAll({ isFeatured: true, isPublished: true, limit });
}
