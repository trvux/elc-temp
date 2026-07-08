export interface Author {
  id: string;
  name: string;
  slug: string;
  avatarUrl: string;
  bio: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateAuthorInput {
  name: string;
  slug: string;
  avatarUrl?: string;
  bio?: string;
}

export interface UpdateAuthorInput extends Partial<CreateAuthorInput> {
  id: string;
}

export interface AuthorFilter {
  search?: string;
  limit?: number;
  offset?: number;
  includeDeleted?: boolean;
}
