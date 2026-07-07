import { ProjectWithCategory } from "@/modules/project/domain/types";
import { ProjectTypeWithCategories } from "@/modules/project-type/domain/types";
import { getProjectTypeByIdAction } from "@/modules/project-type/presentation/actions";
import { cacheLife, cacheTag } from "next/cache";
import { resolveProjectDetailAction } from "./actions";
import { getSlugRegistryEntry } from "@/shared/lib/go-api";

export type ResolvedProjectEntity =
  | { type: "project_type"; data: ProjectTypeWithCategories }
  | { type: "project"; data: ProjectWithCategory }
  | null;

/**
 * Tra cuu loai thuc the (project_type hoac project) tu slug_registry qua Go
 * API, roi dispatch: `project_type` qua getProjectTypeByIdAction, `project`
 * qua resolveProjectDetailAction (xem docs/project.md).
 */
export async function resolveProjectPathFromDb(slug: string): Promise<ResolvedProjectEntity> {
  "use cache";
  cacheLife("days");
  cacheTag(`slug:${slug}`);

  const registryItem = await getSlugRegistryEntry(slug);
  if (!registryItem) {
    return null;
  }

  if (registryItem.entityType === "project_type") {
    const { data: projectType, error } = await getProjectTypeByIdAction(registryItem.entityId);
    if (error || !projectType) {
      return null;
    }
    return { type: "project_type", data: projectType };
  }

  if (registryItem.entityType === "project") {
    const { data: project, error } = await resolveProjectDetailAction(slug);
    if (error || !project) {
      return null;
    }
    return { type: "project", data: project };
  }

  return null;
}
