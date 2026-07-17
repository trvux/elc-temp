import type { ImageAsset } from "@/shared/lib/image-asset";
export type { ImageAsset };

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
  images: ImageAsset[];
  content: Json;
  excerpt?: string;
  categoryId?: string | null;
  authorId?: string | null;
  isPublished: boolean;
  metaTitle?: string | null;
  metaDescription?: string | null;
  orderIndex: number;
  tags?: { id: string; name: string; slug: string }[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateNewsInput {
  title: string;
  slug: string;
  images?: ImageAsset[];
  content?: Json;
  excerpt?: string;
  categoryId?: string | null;
  authorId?: string | null;
  isPublished?: boolean;
  metaTitle?: string | null;
  metaDescription?: string | null;
  orderIndex?: number;
  tagIds?: string[];
}

export interface UpdateNewsInput extends Partial<CreateNewsInput> {
  id: string;
}


