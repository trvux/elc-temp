import { ContactType } from "./constants";

export interface Contact {
  id: string;
  type: ContactType | string;
  label: string | null;
  value: string;
  isActive: boolean;
  orderIndex: number;
  href: string;
  isExternal: boolean;
}

export interface CreateContactInput {
  type: ContactType | string;
  label?: string | null;
  value: string;
  isActive?: boolean;
  orderIndex?: number;
}

export interface UpdateContactInput extends Partial<CreateContactInput> {
  id: string;
}

export interface ContactFilter {
  type?: string;
  search?: string;
}
