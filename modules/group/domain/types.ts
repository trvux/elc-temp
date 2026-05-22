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
}

export interface CreateGroupInput {
  name: string;
  slug: string;
  imageUrl?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  isFeatured?: boolean;
  orderIndex?: number;
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
}
