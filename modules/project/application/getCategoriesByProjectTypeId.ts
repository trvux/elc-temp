import { ProjectRepository } from "../domain/repository";

/**
 * Lay cac danh muc duoc su dung boi cac du an thuoc mot loai cong trinh cu the.
 * Dung cho bo loc tren trang danh sach du an theo loai.
 */
export const getCategoriesByProjectTypeId = (
  projectRepo: ProjectRepository,
  projectTypeId: string,
): Promise<{ id: string; name: string; slug: string }[]> => {
  return projectRepo.getCategoriesByProjectTypeId(projectTypeId);
};
