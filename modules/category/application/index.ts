import { createCategorySchema, updateCategorySchema } from "../domain/validators";
import { categoryRepo } from "../infrastructure/categoryRepo";
import { Category, CategoryWithGroup, CreateCategoryInput, UpdateCategoryInput } from "../domain/types";
import { CategoryFilter } from "../domain/repository";

export async function getCategories(options?: CategoryFilter): Promise<CategoryWithGroup[]> {
  return categoryRepo.getAll(options);
}

export async function getCategoryById(id: string): Promise<CategoryWithGroup | null> {
  return categoryRepo.getById(id);
}

export async function createCategory(input: CreateCategoryInput): Promise<Category> {
  const validated = createCategorySchema.parse(input);
  return categoryRepo.create(validated as CreateCategoryInput);
}

export async function updateCategory(input: UpdateCategoryInput): Promise<Category> {
  const validated = updateCategorySchema.parse(input);
  return categoryRepo.update(validated as UpdateCategoryInput);
}

export async function deleteCategory(id: string): Promise<void> {
  return categoryRepo.delete(id);
}
