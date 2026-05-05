import { categoryRepo } from "../infrastructure/categoryRepo";

export async function deleteCategory(id: string): Promise<void> {
  return categoryRepo.delete(id);
}
