import type { Seo } from "@/shared/lib/seo-schema";
export type { Seo };

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
  seo?: Seo;
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
    lowPrice?: number;
    highPrice?: number;
    offerCount?: number;
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
  seo?: Seo;
  orderIndex?: number;
  categoryId: string;
  projectTypeId?: string | null;
  serviceIds?: string[];
  categories?: { id: string; condition: "new" | "used" }[];
}

export interface UpdateProjectInput extends Partial<CreateProjectInput> {
  id: string;
}
