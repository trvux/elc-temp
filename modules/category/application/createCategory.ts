import {Category, CreateCategoryInput} from "../domain/types";
import {createCategorySchema} from "@/modules/category";
import {categoryRepo} from "../infrastructure/categoryRepo";

export async function createCategory(input: CreateCategoryInput): Promise<Category> {
    // Validate input
    const validated = createCategorySchema.parse(input);

    return categoryRepo.create(validated as CreateCategoryInput);
}
