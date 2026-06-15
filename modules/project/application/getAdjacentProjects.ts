import { ProjectWithCategory } from "../domain/types";
import { ProjectRepository } from "../domain/repository";
import { getProjects } from "./getProjects";

export interface AdjacentProject {
  title: string;
  slug: string;
}

export interface AdjacentProjects {
  prev: AdjacentProject | null;
  next: AdjacentProject | null;
}

/**
 * Lấy dự án liền trước / liền sau trong cùng nhóm để hiển thị pager điều hướng.
 *
 * Nhóm ưu tiên theo loại công trình (projectType); nếu dự án không có loại
 * công trình thì gom theo toàn bộ dự án đã xuất bản. Thứ tự sắp xếp đồng nhất
 * với trang danh sách: dự án nổi bật lên đầu, sau đó theo orderIndex.
 */
export const getAdjacentProjects = async (
  projectRepo: ProjectRepository,
  project: Pick<ProjectWithCategory, "id" | "projectTypeId">,
): Promise<AdjacentProjects> => {
  // Ưu tiên các dự án cùng loại công trình.
  let siblings = await getProjects(projectRepo, {
    isPublished: true,
    projectTypeId: project.projectTypeId || undefined,
  });

  // Fallback: nếu nhóm cùng loại không đủ để điều hướng, gom toàn bộ dự án
  // đã xuất bản để người dùng vẫn có thể chuyển qua lại.
  if (siblings.length < 2) {
    siblings = await getProjects(projectRepo, { isPublished: true });
  }

  const sorted = [...siblings].sort((a, b) => {
    if (a.isFeatured && !b.isFeatured) return -1;
    if (!a.isFeatured && b.isFeatured) return 1;
    return a.orderIndex - b.orderIndex;
  });

  const currentIndex = sorted.findIndex((p) => p.id === project.id);
  if (currentIndex === -1 || sorted.length < 2) {
    return { prev: null, next: null };
  }

  const toItem = (p: ProjectWithCategory): AdjacentProject => ({
    title: p.title,
    slug: p.slug || "",
  });

  const prev = currentIndex > 0 ? toItem(sorted[currentIndex - 1]) : null;
  const next =
    currentIndex < sorted.length - 1 ? toItem(sorted[currentIndex + 1]) : null;

  return { prev, next };
};
