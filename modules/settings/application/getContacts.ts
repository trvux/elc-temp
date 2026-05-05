import { contactRepo } from "../infrastructure/contactRepo";

export const getContacts = () => {
  return contactRepo.getAll();
};
