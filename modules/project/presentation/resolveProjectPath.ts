import { createClient, setUseStaticClient } from "@/shared/lib/supabase/server";
import { ProjectWithCategory } from "@/modules/project/domain/types";
import { ProjectTypeWithCategories } from "@/modules/project-type/domain/types";
import { getProjectTypeByIdAction } from "@/modules/project-type/presentation/actions";
import { cacheLife, cacheTag } from "next/cache";
import { resolveProjectDetailAction } from "./actions";

export type ResolvedProjectEntity =
  | { type: "project_type"; data: ProjectTypeWithCategories }
  | { type: "project"; data: ProjectWithCategory }
  | null;

/**
 * Tra cuu loai thuc the (project_type hoac project) tu slug_registry.
 *
 * Ca 2 nhanh da chuyen sang goi Go: `project_type` qua getProjectTypeByIdAction,
 * `project` qua resolveProjectDetailAction (xem docs/project.md). slug_registry
 * van duoc doc truc tiep tu Supabase o day vi no la bang dung chung cho nhieu
 * module (chua co module rieng so huu), khong phai mot phan cua project-type.
 */
export async function resolveProjectPathFromDb(slug: string): Promise<ResolvedProjectEntity> {
  "use cache";
  cacheLife("days");
  cacheTag(`slug:${slug}`);
  setUseStaticClient(true);

  const supabase = await createClient();

  const { data: registryItemRow, error: registryError } = await supabase
    .from("slug_registry")
    .select("entity_type, entity_id")
    .eq("slug", slug)
    .is("deleted_at", null)
    .maybeSingle();

  const registryItem = registryItemRow as { entity_type: string; entity_id: string } | null;

  if (registryError || !registryItem) {
    return null;
  }

  if (registryItem.entity_type === "project_type") {
    const { data: projectType, error } = await getProjectTypeByIdAction(registryItem.entity_id);
    if (error || !projectType) {
      return null;
    }
    return { type: "project_type", data: projectType };
  }

  if (registryItem.entity_type === "project") {
    const { data: project, error } = await resolveProjectDetailAction(slug);
    if (error || !project) {
      return null;
    }
    return { type: "project", data: project };
  }

  return null;
}
