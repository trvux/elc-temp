export interface ServiceGroup {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  isFeatured: boolean;
  orderIndex: number;
  categoryIds?: string[] | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateServiceGroupInput {
  name: string;
  slug: string;
  imageUrl?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  isFeatured?: boolean;
  orderIndex?: number;
  categoryIds?: string[] | null;
}

export interface UpdateServiceGroupInput {
  id: string;
  name?: string;
  slug?: string;
  imageUrl?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  isFeatured?: boolean;
  orderIndex?: number;
  categoryIds?: string[] | null;
}
