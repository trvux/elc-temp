import { SiteSetting } from "./types";

export interface SettingsRepository {
  getAll(): Promise<SiteSetting[]>;
  updateMany(settings: SiteSetting[]): Promise<void>;
}
