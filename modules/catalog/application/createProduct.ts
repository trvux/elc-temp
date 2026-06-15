import { Product, CreateProductInput, createProductSchema } from "../domain";
import { ProductRepository } from "../domain/repository";

export async function createProduct(
  productRepo: ProductRepository,
  input: CreateProductInput,
): Promise<Product> {
  const validated = createProductSchema.parse(input);
  return productRepo.create(validated);
}
