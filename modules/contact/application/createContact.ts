import { CreateContactInput, createContactSchema } from "../domain";
import { contactRepo } from "../infrastructure";

export async function createContact(input: CreateContactInput) {
  const validated = createContactSchema.parse(input);
  return await contactRepo.create(validated as CreateContactInput);
}
