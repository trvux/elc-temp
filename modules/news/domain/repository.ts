import { News, CreateNewsInput, UpdateNewsInput } from "./types";

export interface NewsFilter {
  isPublished?: boolean;
  search?: string;
  categoryId?: string | null;
  excludeId?: string;
  limit?: number;
  offset?: number;
  includeDeleted?: boolean;
}

export interface NewsRepository {
  getAll(options?: NewsFilter): Promise<News[]>;
  count(options?: NewsFilter): Promise<number>;
  getById(id: string): Promise<News | null>;
  getBySlug(slug: string): Promise<News | null>;
  create(input: CreateNewsInput): Promise<News>;
  update(input: UpdateNewsInput): Promise<News>;
  delete(id: string): Promise<void>;
}
