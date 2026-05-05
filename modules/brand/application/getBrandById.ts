import { Brand } from "../domain/types";
import { brandRepo } from "../infrastructure/brandRepo";

export async function getBrandById(id: string): Promise<Brand | null> {
  return brandRepo.getById(id);
}
