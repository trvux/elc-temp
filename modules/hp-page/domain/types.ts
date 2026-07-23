export interface HpPage {
  id: string;
  name: string;
  slug: string;
  imageUrl: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
  orderIndex?: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  content?: unknown | null;
  // Three independent, combinable (AND) filters — a page needs at least
  // one. attributeCode/attributeValues: generic, not hardcoded, which
  // attribute_definitions.code this page filters by (e.g. "phan_khuc_hp")
  // and which of its options match. categoryIds/brandIds: scope to
  // specific categories and/or brands instead of (or combined with) the
  // attribute — e.g. "Máy lạnh Daikin" (category=máy lạnh's
  // sub-categories, brand=Daikin), distinct from the plain brand page
  // (all of Daikin's products, whatever categories that spans).
  attributeCode: string | null;
  attributeValues: string[];
  categoryIds: string[];
  brandIds: string[];
}

export interface CreateHpPageInput {
  name: string;
  slug: string;
  imageUrl?: string;
  orderIndex?: number;
  metaTitle?: string | null;
  metaDescription?: string | null;
  content?: unknown | null;
  attributeCode: string | null;
  attributeValues: string[];
  categoryIds: string[];
  brandIds: string[];
}

export interface UpdateHpPageInput extends Partial<CreateHpPageInput> {
  id: string;
}

export interface HpPageFilter {
  search?: string;
  limit?: number;
  offset?: number;
  includeDeleted?: boolean;
}
