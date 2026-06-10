export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

import { AboutBlockType } from "./constants";

export interface Page {
  id: string;
  title: string;
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

export interface AboutBlock {
  id: string;
  type: AboutBlockType | string;
  content: string;
  caption: string;
  orderIndex: number;
  createdAt: string;
}

export interface CreatePageInput {
  title: string;
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

export interface CreateAboutBlockInput {
  type: AboutBlockType | string;
  content: string;
  caption?: string;
  orderIndex?: number;
}
