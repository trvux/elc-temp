import { BrandRepository } from "../domain";

export async function deleteBrand(brandRepo: BrandRepository, id: string): Promise<void> {
  return brandRepo.delete(id);
}
