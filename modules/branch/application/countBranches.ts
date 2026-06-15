import { BranchFilter, BranchRepository } from "../domain";

export const countBranches = (branchRepo: BranchRepository, options?: Pick<BranchFilter, "isPublished" | "search">) => {
  return branchRepo.count(options);
};
