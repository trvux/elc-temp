import { branchRepo } from "../infrastructure/branchRepo";

export const getBranchBySlug = (slug: string) => {
  return branchRepo.getBySlug(slug);
};
