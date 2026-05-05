import { 
  Category, 
  CategoryType, 
  CategoryWithChildren, 
  CreateCategoryInput, 
  UpdateCategoryInput 
} from "./types";

export interface CategoryFilter {
  type?: CategoryType;
  parentId?: string | null;
  search?: string;
  limit?: number;
  offset?: number;
  includeDeleted?: boolean;
}

export interface CategoryRepository {
  // Base CRUD
  getAll(options?: CategoryFilter): Promise<Category[]>;
  count(options?: Pick<CategoryFilter, "type" | "parentId" | "search" | "includeDeleted">): Promise<number>;
  getById(id: string): Promise<Category | null>;
  getBySlug(slug: string, type?: CategoryType): Promise<Category | null>;
  create(input: CreateCategoryInput): Promise<Category>;
  update(input: UpdateCategoryInput): Promise<Category>;
  delete(id: string): Promise<void>; // Implements soft delete (updates deletedAt)

  // Hierarchy & Tree Optimization
  getTree(type?: CategoryType): Promise<CategoryWithChildren[]>;
  getChildren(parentId: string): Promise<Category[]>;
  
  // Batch Optimization
  getByIds(ids: string[]): Promise<Category[]>;
}
