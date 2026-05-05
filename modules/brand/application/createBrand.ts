import { Brand, CreateBrandInput } from "../domain/types";
import { brandRepo } from "../infrastructure/brandRepo";
import { createBrandSchema } from "../domain/validators";

export async function createBrand(input: CreateBrandInput): Promise<Brand> {
  const validated = createBrandSchema.parse(input);
  return brandRepo.create(validated);
}
