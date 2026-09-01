import type { ImageAsset } from "@/shared/lib/image-asset";
export type { ImageAsset };

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

interface Project {
  id: string;
  title: string;
  slug: string;
  description: Json;
  images: ImageAsset[];
  isFeatured: boolean;
  isPublished: boolean;
  metaTitle?: string | null;
  metaDescription?: string | null;
  orderIndex: number;
  projectTypeId: string | null;
  clientName?: string;
  location?: string;
  completedAt?: string | null;
  testimonialQuote?: string;
  testimonialAuthor?: string;
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
  services?: {
    id: string;
    title: string;
    slug: string;
    group?: { id: string; name: string; slug: string } | null;
  }[];
  categories?: {
    id: string;
    name: string;
    slug: string;
    groupId: string | null;
    group?: { id: string; name: string } | null;
    condition: "new" | "used";
  }[];
  tags?: { id: string; name: string; slug: string }[];
}

export interface CreateProjectInput {
  title: string;
  slug: string;
  description?: Json;
  images?: ImageAsset[];
  isFeatured?: boolean;
  isPublished?: boolean;
  metaTitle?: string | null;
  metaDescription?: string | null;
  orderIndex?: number;
  projectTypeId?: string | null;
  serviceIds?: string[];
  categories?: { id: string; condition: "new" | "used" }[];
  tagIds?: string[];
  clientName?: string;
  location?: string;
  completedAt?: string | null;
  testimonialQuote?: string;
  testimonialAuthor?: string;
}

export interface UpdateProjectInput extends Partial<CreateProjectInput> {
  id: string;
}

export interface ProjectFilter {
  projectTypeId?: string;
  categorySlug?: string;
  categorySlugs?: string[];
  serviceSlug?: string;
  serviceSlugs?: string[];
  isPublished?: boolean;
  isFeatured?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
  includeDeleted?: boolean;
  orderBy?: "orderIndex" | "createdAt" | "title";
  orderDirection?: "asc" | "desc";
}
