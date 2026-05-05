import { Category } from "../domain/types";
import { CategoryFilter } from "../domain/repository";
import { categoryRepo } from "../infrastructure/categoryRepo";

export async function getCategories(options?: CategoryFilter): Promise<Category[]> {
    return categoryRepo.getAll(options);
}
