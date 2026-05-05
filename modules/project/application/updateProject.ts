import { UpdateProjectInput } from "../domain";
import { projectRepo } from "../infrastructure/projectRepo";

/**
 * Cập nhật thông tin dự án
 */
export const updateProject = (input: UpdateProjectInput) => {
  return projectRepo.update(input);
};

/**
 * Cập nhật nhanh trạng thái hiển thị
 */
export const toggleProjectPublish = (id: string, isPublished: boolean) => {
  return projectRepo.togglePublish(id, isPublished);
};

/**
 * Cập nhật nhanh trạng thái nổi bật
 */
export const toggleProjectFeatured = (id: string, isFeatured: boolean) => {
  return projectRepo.toggleFeatured(id, isFeatured);
};

/**
 * Cập nhật thứ tự hiển thị
 */
export const updateProjectOrder = (id: string, orderIndex: number) => {
  return projectRepo.updateOrder(id, orderIndex);
};
