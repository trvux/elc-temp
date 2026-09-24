export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type TitleAlign = "left" | "center" | "right";

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
