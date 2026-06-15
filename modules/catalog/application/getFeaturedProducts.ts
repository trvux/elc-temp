import { ProductWithRelations } from "../domain";
import { ProductRepository } from "../domain/repository";

export async function getFeaturedProducts(
  productRepo: ProductRepository,
  limit: number = 4,
): Promise<ProductWithRelations[]> {
  return productRepo.getAll({ isFeatured: true, isPublished: true, limit });
}
