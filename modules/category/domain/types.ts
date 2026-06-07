import { Group } from "@/modules/group/domain/types";

export interface Category {
  id: string;
  name: string;
  groupId: string | null;
  slug: string;
  imageUrl: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  isFeatured: boolean;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CategoryWithGroup extends Category {
  group?: Group | null;
}

export interface CreateCategoryInput {
  name: string;
  groupId?: string | null;
  slug: string;
  imageUrl?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  isFeatured?: boolean;
  orderIndex?: number;
}

export interface UpdateCategoryInput {
  id: string;
  name?: string;
  groupId?: string | null;
  slug?: string;
  imageUrl?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  isFeatured?: boolean;
  orderIndex?: number;
}
