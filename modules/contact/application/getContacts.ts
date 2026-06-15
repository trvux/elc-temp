import { ContactFilter, ContactRepository } from "../domain";

export async function getContacts(contactRepo: ContactRepository, options?: ContactFilter) {
  return await contactRepo.getAll(options);
}
