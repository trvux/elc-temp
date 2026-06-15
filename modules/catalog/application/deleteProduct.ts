import { ProductRepository } from "../domain/repository";

export async function deleteProduct(
  productRepo: ProductRepository,
  id: string,
): Promise<void> {
  return productRepo.delete(id);
}
