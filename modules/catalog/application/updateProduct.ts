import { Product, UpdateProductInput, updateProductSchema } from "../domain";
import { productRepo } from "../infrastructure/SupabaseProductRepository";

export async function updateProduct(input: UpdateProductInput): Promise<Product> {
  const validated = updateProductSchema.parse(input);
  return productRepo.update(validated);
}
