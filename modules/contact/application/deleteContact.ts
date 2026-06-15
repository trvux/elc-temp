import { ContactRepository } from "../domain";

export async function deleteContact(contactRepo: ContactRepository, id: string) {
  return await contactRepo.delete(id);
}
