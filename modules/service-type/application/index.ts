import { createServiceTypeSchema, updateServiceTypeSchema } from "../domain/validators";
import { serviceTypeRepo } from "../infrastructure/serviceTypeRepo";
import { ServiceType, ServiceTypeWithCategories, CreateServiceTypeInput, UpdateServiceTypeInput } from "../domain/types";
import { ServiceTypeFilter } from "../domain/repository";

export async function getServiceTypes(options?: ServiceTypeFilter): Promise<ServiceTypeWithCategories[]> {
  return serviceTypeRepo.getAll(options);
}

export async function getServiceTypeById(id: string): Promise<ServiceTypeWithCategories | null> {
  return serviceTypeRepo.getById(id);
}

export async function createServiceType(input: CreateServiceTypeInput): Promise<ServiceType> {
  const validated = createServiceTypeSchema.parse(input);
  return serviceTypeRepo.create(validated as CreateServiceTypeInput);
}

export async function updateServiceType(input: UpdateServiceTypeInput): Promise<ServiceType> {
  const validated = updateServiceTypeSchema.parse(input);
  return serviceTypeRepo.update(validated as UpdateServiceTypeInput);
}

export async function deleteServiceType(id: string): Promise<void> {
  return serviceTypeRepo.delete(id);
}
