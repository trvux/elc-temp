import { ProjectRepository } from "../domain";

/**
 * Xóa mềm dự án
 */
export const deleteProject = (projectRepo: ProjectRepository, id: string) => {
  return projectRepo.delete(id);
};
