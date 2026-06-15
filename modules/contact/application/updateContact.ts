import { UpdateContactInput, updateContactSchema, ContactRepository } from "../domain";

export async function updateContact(contactRepo: ContactRepository, input: UpdateContactInput) {
  const validated = updateContactSchema.parse(input);
  return await contactRepo.update(validated as UpdateContactInput);
}
