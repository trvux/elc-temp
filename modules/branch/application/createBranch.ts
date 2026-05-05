import { CreateBranchInput } from "../domain/types";
import { branchRepo } from "../infrastructure/branchRepo";

export const createBranch = (input: CreateBranchInput) => {
  return branchRepo.create(input);
};
