import { CreateContactInput, createContactSchema, ContactRepository } from "../domain";

export async function createContact(contactRepo: ContactRepository, input: CreateContactInput) {
  const validated = createContactSchema.parse(input);
  return await contactRepo.create(validated as CreateContactInput);
}
