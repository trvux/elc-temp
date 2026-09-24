import type { TitleAlign } from "@/shared/lib/title-align";
export type { TitleAlign };

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Page {
  id: string;
  title: string;
  titleAlign: TitleAlign;
  slug: string;
  content: Json;
  isPublished: boolean;
  metaTitle?: string | null;
  metaDescription?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  orderIndex: number;
}

export interface CreatePageInput {
  title: string;
  titleAlign?: TitleAlign;
  slug: string;
  content?: Json;
  isPublished?: boolean;
  metaTitle?: string | null;
  metaDescription?: string | null;
  orderIndex?: number;
}

export interface UpdatePageInput extends Partial<CreatePageInput> {
  id: string;
}
