import { BranchFilter } from "../domain";
import { branchRepo } from "../infrastructure/branchRepo";

export const countBranches = (options?: Pick<BranchFilter, "isPublished" | "search">) => {
  return branchRepo.count(options);
};
