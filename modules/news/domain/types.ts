import type { Seo } from "@/shared/lib/seo-schema";
export type { Seo };

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface News {
  id: string;
  title: string;
  slug: string;
  image: string;
  content: Json;
  categoryId?: string | null;
  isPublished: boolean;
  metaTitle?: string | null;
  metaDescription?: string | null;
  seo?: Seo;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateNewsInput {
  title: string;
  slug: string;
  image?: string;
  content?: Json;
  categoryId?: string | null;
  isPublished?: boolean;
  metaTitle?: string | null;
  metaDescription?: string | null;
  seo?: Seo;
  orderIndex?: number;
}

export interface UpdateNewsInput extends Partial<CreateNewsInput> {
  id: string;
}


