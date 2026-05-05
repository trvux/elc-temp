import { UpdateContactInput } from "../domain/types";
import { contactRepo } from "../infrastructure/contactRepo";

export const updateContact = (input: UpdateContactInput) => {
  return contactRepo.update(input);
};
