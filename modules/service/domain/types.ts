export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Service {
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

export interface CreateServiceInput {
  title: string;
  slug: string;
  image?: string;
  content?: Json;
  isPublished?: boolean;
  metaTitle?: string | null;
  metaDescription?: string | null;
  orderIndex?: number;
}

export interface UpdateServiceInput extends Partial<CreateServiceInput> {
  id: string;
}


