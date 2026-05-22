import { ProjectFilter } from "../domain";
import { projectRepo } from "../infrastructure/projectRepo";

/**
 * Lấy danh sách dự án với các bộ lọc và phân trang
 */
export const getProjects = (options?: ProjectFilter) => {
  return projectRepo.getAll(options);
};

/**
 * Đếm tổng số dự án theo bộ lọc (phục vụ phân trang)
 */
export const countProjects = (options?: Pick<ProjectFilter, "categoryId" | "serviceTypeId" | "categoryNewSlug" | "isPublished" | "isFeatured" | "search" | "includeDeleted">) => {
  return projectRepo.count(options);
};
