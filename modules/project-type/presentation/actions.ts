"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import {
  createProjectType,
  deleteProjectType,
  getProjectTypes,
  updateProjectType,
} from "../application/index";
import { CreateProjectTypeInput, UpdateProjectTypeInput } from "../domain/types";
import { projectTypeRepo } from "../infrastructure/projectTypeRepo";
import { purgeCloudflareCache } from "@/shared/lib/cloudflare-purge";

export async function getProjectTypesAction() {
  try {
    const data = await getProjectTypes(projectTypeRepo);
    return { data, error: null };
  } catch (error) {
    console.error("getProjectTypesAction error:", error);
    return { data: [], error: "Failed to fetch service types" };
  }
}

export async function createProjectTypeAction(input: CreateProjectTypeInput) {
  try {
    const data = await createProjectType(projectTypeRepo, input);
    revalidatePath("/admin/project-types");
    revalidateTag("layout", { expire: 0 });
    revalidateTag("projects", { expire: 0 });
    await purgeCloudflareCache();
    return { data, error: null };
  } catch (error) {
    console.error("createProjectTypeAction error:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to create service type",
    };
  }
}

export async function updateProjectTypeAction(input: UpdateProjectTypeInput) {
  try {
    const data = await updateProjectType(projectTypeRepo, input);
    revalidatePath("/admin/project-types");
    revalidateTag("layout", { expire: 0 });
    revalidateTag("projects", { expire: 0 });
    await purgeCloudflareCache();
    return { data, error: null };
  } catch (error) {
    console.error("updateProjectTypeAction error:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to update service type",
    };
  }
}

export async function deleteProjectTypeAction(id: string) {
  try {
    await deleteProjectType(projectTypeRepo, id);
    revalidatePath("/admin/project-types");
    revalidateTag("layout", { expire: 0 });
    revalidateTag("projects", { expire: 0 });
    await purgeCloudflareCache();
    return { error: null };
  } catch (error) {
    console.error("deleteProjectTypeAction error:", error);
    return {
      error: error instanceof Error ? error.message : "Failed to delete service type",
    };
  }
}
