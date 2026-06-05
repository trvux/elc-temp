import { serviceRepo } from "../infrastructure/serviceRepo";
import { CreateServiceInput, UpdateServiceInput, ServiceFilter } from "../domain/types";

export const getServices = async (options?: ServiceFilter) => {
  return serviceRepo.getAll(options);
};

export const getServiceById = async (id: string) => {
  return serviceRepo.getById(id);
};

export const getServiceBySlug = async (slug: string) => {
  return serviceRepo.getBySlug(slug);
};

export const createService = async (input: CreateServiceInput) => {
  return serviceRepo.create(input);
};

export const updateService = async (input: UpdateServiceInput) => {
  return serviceRepo.update(input);
};

export const deleteService = async (id: string) => {
  return serviceRepo.softDelete(id);
};

export const restoreService = async (id: string) => {
  return serviceRepo.restore(id);
};
