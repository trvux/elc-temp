import { projectRepo } from "../infrastructure/projectRepo";

/**
 * Lấy chi tiết dự án theo ID
 */
export const getProjectById = (id: string) => {
  return projectRepo.getById(id);
};

/**
 * Lấy danh sách dự án theo mảng ID (Batch fetch)
 */
export const getProjectsByIds = (ids: string[]) => {
  return projectRepo.getByIds(ids);
};
