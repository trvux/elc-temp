import { CreateProjectInput } from "../domain";
import { projectRepo } from "../infrastructure/projectRepo";

/**
 * Tạo mới một dự án
 */
export const createProject = (input: CreateProjectInput) => {
  return projectRepo.create(input);
};
