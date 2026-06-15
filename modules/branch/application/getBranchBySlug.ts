import { BranchRepository } from "../domain";

export const getBranchBySlug = (branchRepo: BranchRepository, slug: string) => {
  return branchRepo.getBySlug(slug);
};
