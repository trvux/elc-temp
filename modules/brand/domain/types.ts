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
  content?: unknown | null;
  // Describes how a warranty claim works for this brand — elc is a
  // reseller, not the manufacturer, so it forwards the unit to the brand
  // rather than servicing it itself, and each brand's process differs.
  // Shown on every product of this brand instead of repeated per-product
  // free text.
  warrantyPolicy?: string | null;
}

export interface CreateBrandInput {
  name: string;
  slug: string;
  logoUrl?: string;
  isFeatured?: boolean;
  orderIndex?: number;
  metaTitle?: string | null;
  metaDescription?: string | null;
  content?: unknown | null;
  warrantyPolicy?: string | null;
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
