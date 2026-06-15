import { ProjectRepository } from "../domain";

/**
 * Lấy dự án theo slug
 */
export const getProjectBySlug = (projectRepo: ProjectRepository, slug: string) => {
  return projectRepo.getBySlug(slug);
};
