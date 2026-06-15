import { CreateProjectInput, ProjectRepository } from "../domain";

/**
 * Tạo mới dự án
 */
export const createProject = (projectRepo: ProjectRepository, input: CreateProjectInput) => {
  return projectRepo.create(input);
};
