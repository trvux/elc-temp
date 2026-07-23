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
  // Generic, not hardcoded — which attribute_definitions.code this page
  // filters products by (default "phan_khuc_hp"), and which of that
  // attribute's options this page matches (e.g. ["1 HP"], or several
  // combined into one page). Same mechanism could back a landing page for
  // a different attribute later without a new migration.
  attributeCode: string;
  attributeValues: string[];
}

export interface CreateHpPageInput {
  name: string;
  slug: string;
  imageUrl?: string;
  orderIndex?: number;
  metaTitle?: string | null;
  metaDescription?: string | null;
  content?: unknown | null;
  attributeCode: string;
  attributeValues: string[];
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
