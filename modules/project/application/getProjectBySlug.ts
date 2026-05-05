import { projectRepo } from "../infrastructure/projectRepo";

/**
 * Lấy chi tiết dự án theo Slug
 */
export const getProjectBySlug = (slug: string) => {
  return projectRepo.getBySlug(slug);
};
