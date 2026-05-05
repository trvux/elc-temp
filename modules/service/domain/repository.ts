import { Service, CreateServiceInput, UpdateServiceInput } from "./types";

export interface ServiceFilter {
  isPublished?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
  includeDeleted?: boolean;
}

export interface ServiceRepository {
  getAll(options?: ServiceFilter): Promise<Service[]>;
  count(options?: ServiceFilter): Promise<number>;
  getById(id: string): Promise<Service | null>;
  getBySlug(slug: string): Promise<Service | null>;
  create(input: CreateServiceInput): Promise<Service>;
  update(input: UpdateServiceInput): Promise<Service>;
  delete(id: string): Promise<void>;
  getByIds(ids: string[]): Promise<Service[]>;
}
