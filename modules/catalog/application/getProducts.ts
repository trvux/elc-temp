import { ProductWithRelations, ProductFilter } from "../domain";
import { productRepo } from "../infrastructure/SupabaseProductRepository";

export async function getProducts(options?: ProductFilter): Promise<ProductWithRelations[]> {
  return productRepo.getAll(options);
}
