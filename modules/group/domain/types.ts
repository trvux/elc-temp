export interface Group {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  isFeatured: boolean;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  content?: unknown | null;
  faq?: Array<{ question: string; answer: string }> | null;
}

export interface CreateGroupInput {
  name: string;
  slug: string;
  imageUrl?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  isFeatured?: boolean;
  orderIndex?: number;
  content?: unknown | null;
  faq?: Array<{ question: string; answer: string }> | null;
}

export interface UpdateGroupInput {
  id: string;
  name?: string;
  slug?: string;
  imageUrl?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  isFeatured?: boolean;
  orderIndex?: number;
  content?: unknown | null;
  faq?: Array<{ question: string; answer: string }> | null;
}

export interface GroupFilter {
  search?: string;
  limit?: number;
  offset?: number;
  includeDeleted?: boolean;
}
