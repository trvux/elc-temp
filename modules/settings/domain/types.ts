import { ContactType, SettingsKey } from "./constants";

export interface SiteSetting {
  key: SettingsKey | string;
  value: string;
}

export interface Contact {
  id: string;
  type: ContactType | string;
  label: string;
  value: string;
  orderIndex: number;
}

export interface UpdateSettingsInput {
  settings: SiteSetting[];
}

export interface CreateContactInput {
  type: ContactType | string;
  label: string;
  value: string;
  orderIndex?: number;
}

export interface UpdateContactInput extends Partial<CreateContactInput> {
  id: string;
}
