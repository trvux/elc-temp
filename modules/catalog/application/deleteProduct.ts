import { productRepo } from "../infrastructure/SupabaseProductRepository";

export async function deleteProduct(id: string): Promise<void> {
  return productRepo.delete(id);
}
