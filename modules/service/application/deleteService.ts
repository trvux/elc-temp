import { serviceRepo } from "../infrastructure";

export async function deleteService(id: string): Promise<void> {
  return serviceRepo.delete(id);
}
