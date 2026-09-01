export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

import type { ImageAsset } from "@/shared/lib/image-asset";
export type { ImageAsset };

export interface Branch {
  id: string;
  name: string;
  slug: string;
  address: string;
  phone: string;
  email: string;
  mapsUrl: string;
  mapsEmbed: string;
  provinceCode?: string | null;
  provinceName?: string | null;
  wardCode?: string | null;
  wardName?: string | null;
  postalCode?: string | null;
  description: Json;
  images: ImageAsset[];
  isPublished: boolean;
  metaTitle?: string | null;
  metaDescription?: string | null;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateBranchInput {
  name: string;
  slug: string;
  address: string;
  phone: string;
  email: string;
  mapsUrl: string;
  mapsEmbed: string;
  provinceCode?: string | null;
  provinceName?: string | null;
  wardCode?: string | null;
  wardName?: string | null;
  postalCode?: string | null;
  description: Json;
  images?: ImageAsset[];
  isPublished: boolean;
  metaTitle?: string | null;
  metaDescription?: string | null;
  orderIndex: number;
}

export interface UpdateBranchInput extends Partial<CreateBranchInput> {
  id: string;
}

export interface BranchFilter {
  isPublished?: boolean;
  limit?: number;
  offset?: number;
  search?: string;
}
