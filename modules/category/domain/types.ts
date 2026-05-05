import { CategoryType } from "./constants";

export type { CategoryType };

export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  type: CategoryType;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null; // null means not deleted (Soft Delete)
}

export interface CategoryWithChildren extends Category {
  children?: Category[];
}

export interface CategoryWithParent extends Category {
  parent?: Category | null;
}

export interface CreateCategoryInput {
  name: string;
  slug: string;
  parentId?: string | null;
  type: CategoryType;
}

export interface UpdateCategoryInput extends Partial<CreateCategoryInput> {
  id: string;
}
