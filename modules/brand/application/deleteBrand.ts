import { brandRepo } from "../infrastructure/brandRepo";

export async function deleteBrand(id: string): Promise<void> {
  return brandRepo.delete(id);
}
