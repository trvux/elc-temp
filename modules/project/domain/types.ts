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
  orderIndex: number;
  categoryId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface ProjectWithCategory extends Project {
  category?: { id: string; name: string; slug: string } | null;
}

export interface CreateProjectInput {
  title: string;
  slug: string;
  description?: Json;
  images?: string[];
  isFeatured?: boolean;
  isPublished?: boolean;
  orderIndex?: number;
  categoryId: string;
}

export interface UpdateProjectInput extends Partial<CreateProjectInput> {
  id: string;
}
