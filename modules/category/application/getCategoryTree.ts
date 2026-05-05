import { CategoryType, CategoryWithChildren } from "../domain/types";
import { categoryRepo } from "../infrastructure/categoryRepo";

export async function getCategoryTree(type?: CategoryType): Promise<CategoryWithChildren[]> {
    return categoryRepo.getTree(type);
}
