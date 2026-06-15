import { Brand, BrandRepository } from "../domain";

export async function getBrandBySlug(brandRepo: BrandRepository, slug: string): Promise<Brand | null> {
  return brandRepo.getBySlug(slug);
}
