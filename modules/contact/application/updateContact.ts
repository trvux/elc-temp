import { UpdateContactInput, updateContactSchema } from "../domain";
import { contactRepo } from "../infrastructure";

export async function updateContact(input: UpdateContactInput) {
  const validated = updateContactSchema.parse(input);
  return await contactRepo.update(validated as UpdateContactInput);
}
