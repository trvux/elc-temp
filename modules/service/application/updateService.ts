import { Service, UpdateServiceInput, updateServiceSchema } from "../domain";
import { serviceRepo } from "../infrastructure";

export async function updateService(input: UpdateServiceInput): Promise<Service> {
  const validated = updateServiceSchema.parse(input) as UpdateServiceInput;
  return serviceRepo.update(validated);
}
