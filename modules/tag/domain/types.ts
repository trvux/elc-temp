export interface Tag {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateTagInput {
  name: string;
  slug: string;
}

export interface UpdateTagInput extends Partial<CreateTagInput> {
  id: string;
}

export interface TagFilter {
  search?: string;
  limit?: number;
  offset?: number;
  includeDeleted?: boolean;
}

export interface TagRef {
  id: string;
  name: string;
  slug: string;
}
