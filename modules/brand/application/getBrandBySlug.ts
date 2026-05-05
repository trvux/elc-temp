import { Brand } from "../domain/types";
import { brandRepo } from "../infrastructure/brandRepo";

export async function getBrandBySlug(slug: string): Promise<Brand | null> {
  return brandRepo.getBySlug(slug);
}
