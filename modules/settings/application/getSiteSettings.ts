import { SettingsRepository } from "../domain";

export const getSiteSettings = async (settingsRepo: SettingsRepository) => {
  return settingsRepo.getAll();
};
