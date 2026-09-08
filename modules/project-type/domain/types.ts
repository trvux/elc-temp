import { CategoryWithGroup } from "@/modules/category/domain/types";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface ProjectType {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  isFeatured: boolean;
  orderIndex: number;
  content?: Json;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface ProjectTypeWithCategories extends ProjectType {
  categories: CategoryWithGroup[];
}

export interface CreateProjectTypeInput {
  name: string;
  slug: string;
  image?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  isFeatured?: boolean;
  orderIndex?: number;
  content?: Json;
  categoryIds?: string[];
}

export interface UpdateProjectTypeInput {
  id: string;
  name?: string;
  slug?: string;
  image?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  isFeatured?: boolean;
  orderIndex?: number;
  content?: Json;
  categoryIds?: string[];
}
