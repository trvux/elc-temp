import { branchRepo } from "../infrastructure/branchRepo";

export const updateBranchOrder = (id: string, orderIndex: number) => {
  return branchRepo.updateOrder(id, orderIndex);
};
