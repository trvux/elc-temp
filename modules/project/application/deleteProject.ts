import { projectRepo } from "../infrastructure/projectRepo";

/**
 * Xóa dự án (Soft delete)
 */
export const deleteProject = (id: string) => {
  return projectRepo.delete(id);
};
