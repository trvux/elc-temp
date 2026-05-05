import { SiteSetting } from "../domain/types";
import { settingsRepo } from "../infrastructure/settingsRepo";

export const updateSettings = (settings: SiteSetting[]) => {
  return settingsRepo.updateMany(settings);
};
