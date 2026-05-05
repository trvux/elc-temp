import { Service } from "../domain";
import { serviceRepo } from "../infrastructure";

export async function getServiceBySlug(slug: string): Promise<Service | null> {
  return serviceRepo.getBySlug(slug);
}
