import {
  CreateProjectInput,
  Project,
  ProjectWithCategory,
  UpdateProjectInput,
} from "./types";

export interface ProjectFilter {
  categoryId?: string;
  projectTypeId?: string;
  categorySlug?: string;
  categorySlugs?: string[];
  serviceSlug?: string;
  serviceSlugs?: string[];
  isPublished?: boolean;
  isFeatured?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
  includeDeleted?: boolean;
  orderBy?: "orderIndex" | "createdAt" | "title";
  orderDirection?: "asc" | "desc";
}

export interface ProjectRepository {
  getAll(options?: ProjectFilter): Promise<ProjectWithCategory[]>;

  count(
    options?: Pick<
      ProjectFilter,
      "categoryId" | "projectTypeId" | "categorySlug" | "categorySlugs" | "serviceSlug" | "serviceSlugs" | "isPublished" | "isFeatured" | "search" | "includeDeleted"
    >,
  ): Promise<number>;

  getById(id: string): Promise<ProjectWithCategory | null>;

  getBySlug(slug: string): Promise<ProjectWithCategory | null>;

  create(input: CreateProjectInput): Promise<Project>;

  update(input: UpdateProjectInput): Promise<Project>;

  delete(id: string): Promise<void>;

  getByIds(ids: string[]): Promise<ProjectWithCategory[]>;

  updateOrder(id: string, orderIndex: number): Promise<void>;

  togglePublish(id: string, isPublished: boolean): Promise<void>;

  toggleFeatured(id: string, isFeatured: boolean): Promise<void>;

  getFeatured(limit?: number): Promise<ProjectWithCategory[]>;

  getRelated(
    projectId: string,
    categoryId: string,
    limit?: number,
  ): Promise<ProjectWithCategory[]>;

  getCategoriesByProjectTypeId(projectTypeId: string): Promise<
    {
      id: string;
      name: string;
      slug: string;
    }[]
  >;
}
