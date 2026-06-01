import { ContactFilter } from "../domain";
import { contactRepo } from "../infrastructure";


export async function getContacts(options?: ContactFilter) {
  return await contactRepo.getAll(options);
}
