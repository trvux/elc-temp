import { Product, CreateProductInput, createProductSchema } from "../domain";
import { productRepo } from "../infrastructure/SupabaseProductRepository";

export async function createProduct(input: CreateProductInput): Promise<Product> {
  const validated = createProductSchema.parse(input);
  return productRepo.create(validated);
}
