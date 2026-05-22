export interface Brand {
  id: string;
  name: string;
  slug: string;
  logoUrl: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
  isFeatured?: boolean;
  orderIndex?: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateBrandInput {
  name: string;
  slug: string;
  logoUrl?: string;
  isFeatured?: boolean;
  orderIndex?: number;
  metaTitle?: string | null;
  metaDescription?: string | null;
}

export interface UpdateBrandInput extends Partial<CreateBrandInput> {
  id: string;
}

export interface BrandFilter {
  search?: string;
  limit?: number;
  offset?: number;
  includeDeleted?: boolean;
}
