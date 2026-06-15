import { createCategorySchema, updateCategorySchema } from "../domain/validators";
import { Category, CategoryWithGroup, CreateCategoryInput, UpdateCategoryInput } from "../domain/types";
import { CategoryFilter, CategoryRepository } from "../domain/repository";

export async function getCategories(categoryRepo: CategoryRepository, options?: CategoryFilter): Promise<CategoryWithGroup[]> {
  return categoryRepo.getAll(options);
}

export async function getCategoryById(categoryRepo: CategoryRepository, id: string): Promise<CategoryWithGroup | null> {
  return categoryRepo.getById(id);
}

export async function createCategory(categoryRepo: CategoryRepository, input: CreateCategoryInput): Promise<Category> {
  const validated = createCategorySchema.parse(input);
  return categoryRepo.create(validated as CreateCategoryInput);
}

export async function updateCategory(categoryRepo: CategoryRepository, input: UpdateCategoryInput): Promise<Category> {
  const validated = updateCategorySchema.parse(input);
  return categoryRepo.update(validated as UpdateCategoryInput);
}

export async function deleteCategory(categoryRepo: CategoryRepository, id: string): Promise<void> {
  return categoryRepo.delete(id);
}
