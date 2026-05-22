import { Group } from "@/modules/group/domain/types";

export interface CategoryNew {
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

export interface CategoryNewWithGroup extends CategoryNew {
  group?: Group | null;
}

export interface CreateCategoryNewInput {
  name: string;
  groupId?: string | null;
  slug: string;
  imageUrl?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  isFeatured?: boolean;
  orderIndex?: number;
}

export interface UpdateCategoryNewInput {
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
