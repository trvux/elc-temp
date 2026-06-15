import { ProductWithRelations } from "../domain";
import { ProductRepository } from "../domain/repository";

export async function getProductBySlug(
  productRepo: ProductRepository,
  slug: string,
): Promise<ProductWithRelations | null> {
  return productRepo.getBySlug(slug);
}
