import { CreateServiceGroupInput, UpdateServiceGroupInput, ServiceGroup } from "../domain/types";
import { ServiceGroupRepository, ServiceGroupFilter } from "../domain/repository";

export async function getServiceGroups(serviceGroupRepo: ServiceGroupRepository, options?: ServiceGroupFilter): Promise<ServiceGroup[]> {
  return serviceGroupRepo.getAll(options);
}

export async function getServiceGroupById(serviceGroupRepo: ServiceGroupRepository, id: string): Promise<ServiceGroup | null> {
  return serviceGroupRepo.getById(id);
}

export async function getServiceGroupBySlug(serviceGroupRepo: ServiceGroupRepository, slug: string): Promise<ServiceGroup | null> {
  return serviceGroupRepo.getBySlug(slug);
}

export async function createServiceGroup(serviceGroupRepo: ServiceGroupRepository, input: CreateServiceGroupInput): Promise<ServiceGroup> {
  return serviceGroupRepo.create(input);
}

export async function updateServiceGroup(serviceGroupRepo: ServiceGroupRepository, input: UpdateServiceGroupInput): Promise<ServiceGroup> {
  return serviceGroupRepo.update(input);
}

export async function deleteServiceGroup(serviceGroupRepo: ServiceGroupRepository, id: string): Promise<void> {
  return serviceGroupRepo.softDelete(id);
}

export async function restoreServiceGroup(serviceGroupRepo: ServiceGroupRepository, id: string): Promise<void> {
  return serviceGroupRepo.restore(id);
}
