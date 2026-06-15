import { Brand, BrandRepository } from "../domain";

export async function getBrandById(brandRepo: BrandRepository, id: string): Promise<Brand | null> {
  return brandRepo.getById(id);
}
