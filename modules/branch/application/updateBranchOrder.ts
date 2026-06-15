import { BranchRepository } from "../domain";

export const updateBranchOrder = (branchRepo: BranchRepository, id: string, orderIndex: number) => {
  return branchRepo.updateOrder(id, orderIndex);
};
