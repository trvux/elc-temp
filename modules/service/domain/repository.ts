import {
  Service,
  ServiceWithRelations,
  CreateServiceInput,
  UpdateServiceInput,
  ServiceFilter,
} from "./types";

export interface ServiceRepository {
  count(options?: ServiceFilter): Promise<number>;
  getAll(options?: ServiceFilter): Promise<ServiceWithRelations[]>;
  getById(id: string): Promise<ServiceWithRelations | null>;
  getBySlug(slug: string): Promise<ServiceWithRelations | null>;
  create(input: CreateServiceInput): Promise<Service>;
  update(input: UpdateServiceInput): Promise<Service>;
  softDelete(id: string): Promise<void>;
  restore(id: string): Promise<void>;
}
