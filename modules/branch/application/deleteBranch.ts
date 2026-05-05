import { branchRepo } from "../infrastructure/branchRepo";

export const deleteBranch = (id: string) => {
  return branchRepo.delete(id);
};
