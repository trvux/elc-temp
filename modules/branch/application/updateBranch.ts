import { UpdateBranchInput } from "../domain/types";
import { branchRepo } from "../infrastructure/branchRepo";

export const updateBranch = (input: UpdateBranchInput) => {
  return branchRepo.update(input);
};
