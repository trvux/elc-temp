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
  isPublished: boolean;
  metaTitle?: string | null;
  metaDescription?: string | null;
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
  isPublished?: boolean;
  metaTitle?: string | null;
  metaDescription?: string | null;
  orderIndex?: number;
}

export interface UpdateNewsInput extends Partial<CreateNewsInput> {
  id: string;
}


