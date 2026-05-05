import { Brand, UpdateBrandInput } from "../domain/types";
import { brandRepo } from "../infrastructure/brandRepo";
import { updateBrandSchema } from "../domain/validators";

export async function updateBrand(input: UpdateBrandInput): Promise<Brand> {
  const validated = updateBrandSchema.parse(input);
  return brandRepo.update(validated);
}
