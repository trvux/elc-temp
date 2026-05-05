import { settingsRepo } from "../infrastructure/settingsRepo";

export const getSiteSettings = () => {
  return settingsRepo.getAll();
};
