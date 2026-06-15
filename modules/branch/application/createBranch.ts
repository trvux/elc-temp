import { CreateBranchInput, BranchRepository } from "../domain";

export const createBranch = (branchRepo: BranchRepository, input: CreateBranchInput) => {
  return branchRepo.create(input);
};
