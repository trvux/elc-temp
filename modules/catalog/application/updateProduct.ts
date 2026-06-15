import { Product, UpdateProductInput, updateProductSchema } from "../domain";
import { ProductRepository } from "../domain/repository";

export async function updateProduct(
  productRepo: ProductRepository,
  input: UpdateProductInput,
): Promise<Product> {
  const validated = updateProductSchema.parse(input);
  return productRepo.update(validated);
}
