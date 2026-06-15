import { SettingsKey } from "./constants";

export interface SiteSetting {
  key: SettingsKey | string;
  value: string;
}

export interface UpdateSettingsInput {
  settings: SiteSetting[];
}
