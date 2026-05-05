import { contactRepo } from "../infrastructure/contactRepo";

export const deleteContact = (id: string) => {
  return contactRepo.delete(id);
};
