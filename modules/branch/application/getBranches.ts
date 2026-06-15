import { BranchFilter, BranchRepository } from "../domain";

export const getBranches = (branchRepo: BranchRepository, options?: BranchFilter) => {
  return branchRepo.getAll(options);
};
