import { UpdateProjectInput, ProjectRepository } from "../domain";

/**
 * Cập nhật thông tin dự án
 */
export const updateProject = (projectRepo: ProjectRepository, input: UpdateProjectInput) => {
  return projectRepo.update(input);
};

/**
 * Cập nhật nhanh trạng thái hiển thị
 */
export const toggleProjectPublish = (projectRepo: ProjectRepository, id: string, isPublished: boolean) => {
  return projectRepo.togglePublish(id, isPublished);
};

/**
 * Cập nhật nhanh trạng thái nổi bật
 */
export const toggleProjectFeatured = (projectRepo: ProjectRepository, id: string, isFeatured: boolean) => {
  return projectRepo.toggleFeatured(id, isFeatured);
};

/**
 * Cập nhật thứ tự hiển thị
 */
export const updateProjectOrder = (projectRepo: ProjectRepository, id: string, orderIndex: number) => {
  return projectRepo.updateOrder(id, orderIndex);
};
