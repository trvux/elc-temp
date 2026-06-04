import { ProjectType, ProjectTypeWithCategories, CreateProjectTypeInput, UpdateProjectTypeInput } from "./types";

export interface ProjectTypeFilter {
  search?: string;
  limit?: number;
  offset?: number;
  includeDeleted?: boolean;
}

export interface ProjectTypeRepository {
  getAll(options?: ProjectTypeFilter): Promise<ProjectTypeWithCategories[]>;
  count(options?: Pick<ProjectTypeFilter, "search" | "includeDeleted">): Promise<number>;
  getById(id: string): Promise<ProjectTypeWithCategories | null>;
  create(input: CreateProjectTypeInput): Promise<ProjectType>;
  update(input: UpdateProjectTypeInput): Promise<ProjectType>;
  delete(id: string): Promise<void>;
}
