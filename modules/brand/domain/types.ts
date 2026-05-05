export interface Brand {
  id: string;
  name: string;
  slug: string;
  logoUrl: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateBrandInput {
  name: string;
  slug: string;
  logoUrl?: string;
  description?: string;
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
