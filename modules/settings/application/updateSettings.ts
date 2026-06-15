import { SiteSetting, SettingsRepository } from "../domain";

export const updateSettings = (settingsRepo: SettingsRepository, settings: SiteSetting[]) => {
  return settingsRepo.updateMany(settings);
};
