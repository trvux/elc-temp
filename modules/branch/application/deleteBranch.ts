import { BranchRepository } from "../domain";

export const deleteBranch = (branchRepo: BranchRepository, id: string) => {
  return branchRepo.delete(id);
};
