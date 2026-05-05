import { projectRepo } from "../infrastructure/projectRepo";

/**
 * Lấy danh sách dự án liên quan
 */
export const getRelatedProjects = (projectId: string, categoryId: string, limit?: number) => {
  return projectRepo.getRelated(projectId, categoryId, limit);
};

/**
 * Lấy danh sách dự án nổi bật
 */
export const getFeaturedProjects = (limit?: number) => {
  return projectRepo.getFeatured(limit);
};
