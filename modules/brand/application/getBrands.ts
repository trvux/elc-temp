import { Brand, BrandFilter } from "../domain/types";
import { brandRepo } from "../infrastructure/brandRepo";


export async function getBrands(options?: BrandFilter): Promise<Brand[]> {
  return brandRepo.getAll(options);
}
