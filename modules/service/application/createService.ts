import { Service, CreateServiceInput, createServiceSchema } from "../domain";
import { serviceRepo } from "../infrastructure";

export async function createService(input: CreateServiceInput): Promise<Service> {
  const validated = createServiceSchema.parse(input) as CreateServiceInput;
  return serviceRepo.create(validated);
}
