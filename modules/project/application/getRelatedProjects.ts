import { ProjectRepository } from "../domain";

/**
 * Lấy danh sách dự án liên quan (cùng danh mục, loại trừ dự án hiện tại)
 */
export const getRelatedProjects = (
  projectRepo: ProjectRepository,
  projectId: string,
  categoryId: string,
  limit?: number,
) => {
  return projectRepo.getRelated(projectId, categoryId, limit);
};

/**
 * Lấy danh sách dự án nổi bật
 */
export const getFeaturedProjects = (projectRepo: ProjectRepository, limit?: number) => {
  return projectRepo.getFeatured(limit);
};
