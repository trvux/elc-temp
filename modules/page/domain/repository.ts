import { Page, CreatePageInput, UpdatePageInput, AboutBlock } from "./types";

export interface PageFilter {
  isPublished?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
  includeDeleted?: boolean;
}

export interface PageRepository {
  getAll(options?: PageFilter): Promise<Page[]>;
  count(options?: PageFilter): Promise<number>;
  getById(id: string): Promise<Page | null>;
  getBySlug(slug: string): Promise<Page | null>;
  create(input: CreatePageInput): Promise<Page>;
  update(input: UpdatePageInput): Promise<Page>;
  delete(id: string): Promise<void>;
}

export interface AboutBlockRepository {
  getAll(): Promise<AboutBlock[]>;
  updateAll(blocks: AboutBlock[]): Promise<void>;
}

