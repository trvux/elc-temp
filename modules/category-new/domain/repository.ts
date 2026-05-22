import { CategoryNew, CategoryNewWithGroup, CreateCategoryNewInput, UpdateCategoryNewInput } from "./types";

export interface CategoryNewFilter {
  groupId?: string;
  search?: string;
  limit?: number;
  offset?: number;
  includeDeleted?: boolean;
}

export interface CategoryNewRepository {
  getAll(options?: CategoryNewFilter): Promise<CategoryNewWithGroup[]>;
  count(options?: Pick<CategoryNewFilter, "groupId" | "search" | "includeDeleted">): Promise<number>;
  getById(id: string): Promise<CategoryNewWithGroup | null>;
  create(input: CreateCategoryNewInput): Promise<CategoryNew>;
  update(input: UpdateCategoryNewInput): Promise<CategoryNew>;
  delete(id: string): Promise<void>;
}
