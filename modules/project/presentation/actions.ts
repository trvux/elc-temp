"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { 
  getProjects, 
  countProjects,
  createProject, 
  updateProject, 
  deleteProject,
  toggleProjectPublish,
  toggleProjectFeatured,
  updateProjectOrder
} from "../application/index";
import { CreateProjectInput, UpdateProjectInput, ProjectFilter } from "../domain/index";

export async function getProjectsAction(options?: ProjectFilter) {
  try {
    const data = await getProjects(options);
    return { data, error: null };
  } catch (error) {
    console.error("getProjectsAction error:", error);
    return { data: [], error: "Failed to fetch projects" };
  }
}

export async function countProjectsAction(options?: Pick<ProjectFilter, "categoryId" | "isPublished" | "isFeatured" | "search" | "includeDeleted">) {
  try {
    const data = await countProjects(options);
    return { data, error: null };
  } catch (error) {
    console.error("countProjectsAction error:", error);
    return { data: 0, error: "Failed to count projects" };
  }
}

export async function createProjectAction(input: CreateProjectInput) {
  try {

    const data = await createProject(input);

    revalidatePaths();
    return { data, error: null };
  } catch (error) {
    console.error("createProjectAction - SERVER-SIDE EXCEPTION OCCURRED:", error);
    if (error && typeof error === "object") {
      console.error("createProjectAction - Server error details:", JSON.stringify(error, null, 2));
    }
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to create project",
    };
  }
}

import fs from "fs";
import path from "path";

export async function updateProjectAction(input: UpdateProjectInput) {
  try {

    
    // Write received payload directly to scratch file
    try {
      const scratchDir = "/Users/tranvux/Documents/elc-tem/scratch";
      if (!fs.existsSync(scratchDir)) {
        fs.mkdirSync(scratchDir, { recursive: true });
      }
      fs.writeFileSync(
        path.join(scratchDir, "received-payload.json"),
        JSON.stringify(input.description, null, 2),
        "utf-8"
      );

    } catch (fsErr) {
      console.error("Failed to write scratch file:", fsErr);
    }

    const data = await updateProject(input);

    revalidatePaths();
    return { data, error: null };
  } catch (error) {
    console.error("updateProjectAction - SERVER-SIDE EXCEPTION OCCURRED:", error);
    if (error && typeof error === "object") {
      console.error("updateProjectAction - Server error details:", JSON.stringify(error, null, 2));
    }
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to update project",
    };
  }
}

export async function deleteProjectAction(id: string) {
  try {
    await deleteProject(id);
    revalidatePaths();
    return { error: null };
  } catch (error) {
    console.error("deleteProjectAction error:", error);
    return { error: "Failed to delete project" };
  }
}

export async function toggleProjectPublishAction(id: string, isPublished: boolean) {
  try {
    await toggleProjectPublish(id, isPublished);
    revalidatePaths();
    return { error: null };
  } catch (error) {
    console.error("toggleProjectPublishAction error:", error);
    return { error: "Failed to toggle publish status" };
  }
}

export async function toggleProjectFeaturedAction(id: string, isFeatured: boolean) {
  try {
    await toggleProjectFeatured(id, isFeatured);
    revalidatePaths();
    return { error: null };
  } catch (error) {
    console.error("toggleProjectFeaturedAction error:", error);
    return { error: "Failed to toggle featured status" };
  }
}

export async function updateProjectOrderAction(id: string, orderIndex: number) {
  try {
    await updateProjectOrder(id, orderIndex);
    revalidatePaths();
    return { error: null };
  } catch (error) {
    console.error("updateProjectOrderAction error:", error);
    return { error: "Failed to update project order" };
  }
}

function revalidatePaths() {
  revalidatePath("/admin/projects");
  revalidatePath("/du-an", "layout");
  revalidateTag("projects", { expire: 0 });
}
