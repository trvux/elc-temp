import { Category, CategoryWithGroup, CreateCategoryInput, UpdateCategoryInput } from "./types";

export interface CategoryFilter {
  groupId?: string;
  search?: string;
  limit?: number;
  offset?: number;
  includeDeleted?: boolean;
}

export interface CategoryRepository {
  getAll(options?: CategoryFilter): Promise<CategoryWithGroup[]>;
  count(options?: Pick<CategoryFilter, "groupId" | "search" | "includeDeleted">): Promise<number>;
  getById(id: string): Promise<CategoryWithGroup | null>;
  create(input: CreateCategoryInput): Promise<Category>;
  update(input: UpdateCategoryInput): Promise<Category>;
  delete(id: string): Promise<void>;
}
