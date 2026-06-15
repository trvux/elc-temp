import { ProductWithRelations, ProductFilter } from "../domain";
import { ProductRepository } from "../domain/repository";

export async function getProducts(
  productRepo: ProductRepository,
  options?: ProductFilter,
): Promise<ProductWithRelations[]> {
  return productRepo.getAll(options);
}
