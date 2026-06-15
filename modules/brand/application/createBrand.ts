import { Brand, CreateBrandInput, BrandRepository, createBrandSchema } from "../domain";

export async function createBrand(brandRepo: BrandRepository, input: CreateBrandInput): Promise<Brand> {
  const validated = createBrandSchema.parse(input);
  return brandRepo.create(validated);
}
