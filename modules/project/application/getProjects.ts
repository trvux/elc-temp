import { ProjectFilter, ProjectRepository } from "../domain";

/**
 * Lấy danh sách dự án với các bộ lọc và phân trang
 */
export const getProjects = async (projectRepo: ProjectRepository, options?: ProjectFilter) => {
  return projectRepo.getAll(options);
};

/**
 * Đếm tổng số dự án theo bộ lọc (phục vụ phân trang)
 */
export const countProjects = (projectRepo: ProjectRepository, options?: Pick<ProjectFilter, "categoryId" | "projectTypeId" | "categorySlug" | "isPublished" | "isFeatured" | "search" | "includeDeleted">) => {
  return projectRepo.count(options);
};
