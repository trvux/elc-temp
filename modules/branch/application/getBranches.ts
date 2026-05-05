import { BranchFilter } from "../domain";
import { branchRepo } from "../infrastructure/branchRepo";

export const getBranches = (options?: BranchFilter) => {
  return branchRepo.getAll(options);
};
