import { createProjectTypeSchema, updateProjectTypeSchema } from "../domain/validators";
import { projectTypeRepo } from "../infrastructure/projectTypeRepo";
import { ProjectType, ProjectTypeWithCategories, CreateProjectTypeInput, UpdateProjectTypeInput } from "../domain/types";
import { ProjectTypeFilter } from "../domain/repository";

export async function getProjectTypes(options?: ProjectTypeFilter): Promise<ProjectTypeWithCategories[]> {
  return projectTypeRepo.getAll(options);
}

export async function getProjectTypeById(id: string): Promise<ProjectTypeWithCategories | null> {
  return projectTypeRepo.getById(id);
}

export async function createProjectType(input: CreateProjectTypeInput): Promise<ProjectType> {
  const validated = createProjectTypeSchema.parse(input);
  return projectTypeRepo.create(validated as CreateProjectTypeInput);
}

export async function updateProjectType(input: UpdateProjectTypeInput): Promise<ProjectType> {
  const validated = updateProjectTypeSchema.parse(input);
  return projectTypeRepo.update(validated as UpdateProjectTypeInput);
}

export async function deleteProjectType(id: string): Promise<void> {
  return projectTypeRepo.delete(id);
}
