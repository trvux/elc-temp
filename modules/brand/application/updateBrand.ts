import { Brand, UpdateBrandInput, BrandRepository, updateBrandSchema } from "../domain";

export async function updateBrand(brandRepo: BrandRepository, input: UpdateBrandInput): Promise<Brand> {
  const validated = updateBrandSchema.parse(input);
  return brandRepo.update(validated);
}
