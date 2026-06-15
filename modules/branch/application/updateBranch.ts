import { UpdateBranchInput, BranchRepository } from "../domain";

export const updateBranch = (branchRepo: BranchRepository, input: UpdateBranchInput) => {
  return branchRepo.update(input);
};
