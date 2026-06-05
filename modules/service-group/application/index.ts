import { serviceGroupRepo } from "../infrastructure/serviceGroupRepo";
import { CreateServiceGroupInput, UpdateServiceGroupInput } from "../domain/types";

export const getServiceGroups = async (options?: { includeDeleted?: boolean; isFeatured?: boolean }) => {
  return serviceGroupRepo.getAll(options);
};

export const getServiceGroupById = async (id: string) => {
  return serviceGroupRepo.getById(id);
};

export const getServiceGroupBySlug = async (slug: string) => {
  return serviceGroupRepo.getBySlug(slug);
};

export const createServiceGroup = async (input: CreateServiceGroupInput) => {
  return serviceGroupRepo.create(input);
};

export const updateServiceGroup = async (input: UpdateServiceGroupInput) => {
  return serviceGroupRepo.update(input);
};

export const deleteServiceGroup = async (id: string) => {
  return serviceGroupRepo.softDelete(id);
};

export const restoreServiceGroup = async (id: string) => {
  return serviceGroupRepo.restore(id);
};
