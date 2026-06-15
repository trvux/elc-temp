import { Brand, BrandFilter, BrandRepository } from "../domain";

export async function getBrands(brandRepo: BrandRepository, options?: BrandFilter): Promise<Brand[]> {
  return brandRepo.getAll(options);
}
