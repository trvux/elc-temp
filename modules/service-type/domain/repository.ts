import { ServiceType, ServiceTypeWithCategories, CreateServiceTypeInput, UpdateServiceTypeInput } from "./types";

export interface ServiceTypeFilter {
  search?: string;
  limit?: number;
  offset?: number;
  includeDeleted?: boolean;
}

export interface ServiceTypeRepository {
  getAll(options?: ServiceTypeFilter): Promise<ServiceTypeWithCategories[]>;
  count(options?: Pick<ServiceTypeFilter, "search" | "includeDeleted">): Promise<number>;
  getById(id: string): Promise<ServiceTypeWithCategories | null>;
  create(input: CreateServiceTypeInput): Promise<ServiceType>;
  update(input: UpdateServiceTypeInput): Promise<ServiceType>;
  delete(id: string): Promise<void>;
}
