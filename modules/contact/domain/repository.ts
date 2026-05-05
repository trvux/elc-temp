import { Contact, CreateContactInput, UpdateContactInput, ContactFilter } from "./types";

export interface ContactRepository {
  getAll(options?: ContactFilter): Promise<Contact[]>;
  count(options?: ContactFilter): Promise<number>;
  getById(id: string): Promise<Contact | null>;
  create(input: CreateContactInput): Promise<Contact>;
  update(input: UpdateContactInput): Promise<Contact>;
  delete(id: string): Promise<void>;
}
