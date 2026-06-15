import {
  ServiceGroup,
  CreateServiceGroupInput,
  UpdateServiceGroupInput,
} from "./types";

export interface ServiceGroupFilter {
  includeDeleted?: boolean;
  isFeatured?: boolean;
}

export interface ServiceGroupRepository {
  getAll(options?: ServiceGroupFilter): Promise<ServiceGroup[]>;
  getById(id: string): Promise<ServiceGroup | null>;
  getBySlug(slug: string): Promise<ServiceGroup | null>;
  create(input: CreateServiceGroupInput): Promise<ServiceGroup>;
  update(input: UpdateServiceGroupInput): Promise<ServiceGroup>;
  softDelete(id: string): Promise<void>;
  restore(id: string): Promise<void>;
}
