import { Category } from "../domain/types";
import { categoryRepo } from "../infrastructure/categoryRepo";

export async function getCategoryById(id: string): Promise<Category | null> {
    return categoryRepo.getById(id);
}
