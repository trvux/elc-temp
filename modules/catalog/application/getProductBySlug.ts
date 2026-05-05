import { ProductWithRelations } from "../domain";
import { productRepo } from "../infrastructure/SupabaseProductRepository";

export async function getProductBySlug(slug: string): Promise<ProductWithRelations | null> {
  return productRepo.getBySlug(slug);
}
