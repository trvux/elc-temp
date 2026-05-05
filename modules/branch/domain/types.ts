export const BRANCH_STATUS = {
  PUBLISHED: "published",
  DRAFT: "draft",
} as const;

export type BranchStatus = typeof BRANCH_STATUS[keyof typeof BRANCH_STATUS];

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Branch {
  id: string;
  name: string;
  slug: string;
  address: string;
  phone: string;
  email: string;
  mapsUrl: string;
  mapsEmbed: string;
  description: Json;
  isPublished: boolean;
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
  description: Json;
  isPublished: boolean;
  orderIndex: number;
}

export interface UpdateBranchInput extends Partial<CreateBranchInput> {
  id: string;
}
