import { CreateContactInput } from "../domain/types";
import { contactRepo } from "../infrastructure/contactRepo";

export const createContact = (input: CreateContactInput) => {
  return contactRepo.create(input);
};
