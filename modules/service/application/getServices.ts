import { Service, ServiceFilter } from "../domain";
import { serviceRepo } from "../infrastructure";


export async function getServices(options?: ServiceFilter): Promise<Service[]> {
  return serviceRepo.getAll(options);
}
