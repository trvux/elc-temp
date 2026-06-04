export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Project {
  id: string;
  title: string;
  slug: string;
  description: Json;
  images: string[];
  isFeatured: boolean;
  isPublished: boolean;
  metaTitle?: string | null;
  metaDescription?: string | null;
  orderIndex: number;
  categoryId: string;
  projectTypeId: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface ProjectWithCategory extends Project {
  category?: { 
    id: string; 
    name: string; 
    slug: string;
    parent?: { id: string; name: string; slug: string } | null;
  } | null;
  projectType?: {
    id: string;
    name: string;
    slug?: string;
  } | null;
  categoriesNew?: {
    id: string;
    name: string;
    groupId: string | null;
    group?: { id: string; name: string } | null;
  }[];
}

export interface CreateProjectInput {
  title: string;
  slug: string;
  description?: Json;
  images?: string[];
  isFeatured?: boolean;
  isPublished?: boolean;
  metaTitle?: string | null;
  metaDescription?: string | null;
  orderIndex?: number;
  categoryId: string;
  projectTypeId?: string | null;
  categoryIds?: string[];
}

export interface UpdateProjectInput extends Partial<CreateProjectInput> {
  id: string;
}
