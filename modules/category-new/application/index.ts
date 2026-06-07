import { createCategoryNewSchema, updateCategoryNewSchema } from "../domain/validators";
import { categoryNewRepo } from "../infrastructure/categoryNewRepo";
import { CategoryNew, CategoryNewWithGroup, CreateCategoryNewInput, UpdateCategoryNewInput } from "../domain/types";
import { CategoryNewFilter } from "../domain/repository";

export async function getCategoriesNew(options?: CategoryNewFilter): Promise<CategoryNewWithGroup[]> {
  return categoryNewRepo.getAll(options);
}

export async function getCategoryNewById(id: string): Promise<CategoryNewWithGroup | null> {
  return categoryNewRepo.getById(id);
}

export async function createCategoryNew(input: CreateCategoryNewInput): Promise<CategoryNew> {
  const validated = createCategoryNewSchema.parse(input);
  return categoryNewRepo.create(validated as CreateCategoryNewInput);
}

export async function updateCategoryNew(input: UpdateCategoryNewInput): Promise<CategoryNew> {
  const validated = updateCategoryNewSchema.parse(input);
  return categoryNewRepo.update(validated as UpdateCategoryNewInput);
}

export async function deleteCategoryNew(id: string): Promise<void> {
  return categoryNewRepo.delete(id);
}
