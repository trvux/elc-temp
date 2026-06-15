import { createProjectTypeSchema, updateProjectTypeSchema } from "../domain/validators";
import { ProjectType, ProjectTypeWithCategories, CreateProjectTypeInput, UpdateProjectTypeInput } from "../domain/types";
import { ProjectTypeFilter, ProjectTypeRepository } from "../domain/repository";

export async function getProjectTypes(projectTypeRepo: ProjectTypeRepository, options?: ProjectTypeFilter): Promise<ProjectTypeWithCategories[]> {
  return projectTypeRepo.getAll(options);
}

export async function getProjectTypeById(projectTypeRepo: ProjectTypeRepository, id: string): Promise<ProjectTypeWithCategories | null> {
  return projectTypeRepo.getById(id);
}

export async function createProjectType(projectTypeRepo: ProjectTypeRepository, input: CreateProjectTypeInput): Promise<ProjectType> {
  const validated = createProjectTypeSchema.parse(input);
  return projectTypeRepo.create(validated as CreateProjectTypeInput);
}

export async function updateProjectType(projectTypeRepo: ProjectTypeRepository, input: UpdateProjectTypeInput): Promise<ProjectType> {
  const validated = updateProjectTypeSchema.parse(input);
  return projectTypeRepo.update(validated as UpdateProjectTypeInput);
}

export async function deleteProjectType(projectTypeRepo: ProjectTypeRepository, id: string): Promise<void> {
  return projectTypeRepo.delete(id);
}
