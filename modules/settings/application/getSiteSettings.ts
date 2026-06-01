import { settingsRepo } from "../infrastructure/settingsRepo";


export const getSiteSettings = async () => {
  return settingsRepo.getAll();
};
