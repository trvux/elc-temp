import { contactRepo } from "../infrastructure";

export async function deleteContact(id: string) {
  return await contactRepo.delete(id);
}
