import { ProjectRepository } from "../domain";

/**
 * Lấy dự án theo ID
 */
export const getProjectById = (projectRepo: ProjectRepository, id: string) => {
  return projectRepo.getById(id);
};

/**
 * Lấy danh sách dự án theo mảng ID
 */
export const getProjectsByIds = (projectRepo: ProjectRepository, ids: string[]) => {
  return projectRepo.getByIds(ids);
};
