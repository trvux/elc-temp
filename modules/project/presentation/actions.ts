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
  updateProjectOrder,
  getProjectById
} from "../application/index";
import { CreateProjectInput, UpdateProjectInput, ProjectFilter } from "../domain/index";
import { submitToIndexNow } from "@/shared/lib/indexnow";
import { submitToGoogleIndex } from "@/shared/lib/google-indexing";
import { projectRepo } from "../infrastructure/projectRepo";
import fs from "fs";
import path from "path";

export async function getProjectsAction(options?: ProjectFilter) {
  try {
    const data = await getProjects(projectRepo, options);
    return { data, error: null };
  } catch (error) {
    console.error("getProjectsAction error:", error);
    return { data: [], error: "Failed to fetch projects" };
  }
}

export async function countProjectsAction(options?: Pick<ProjectFilter, "categoryId" | "isPublished" | "isFeatured" | "search" | "includeDeleted">) {
  try {
    const data = await countProjects(projectRepo, options);
    return { data, error: null };
  } catch (error) {
    console.error("countProjectsAction error:", error);
    return { data: 0, error: "Failed to count projects" };
  }
}

export async function createProjectAction(input: CreateProjectInput) {
  try {
    const data = await createProject(projectRepo, input);

    revalidatePaths(data?.slug);
    if (data && data.isPublished && data.slug) {
      const url = `https://dienmayelc.com.vn/du-an/${data.slug}`;
      submitToIndexNow([url]).catch((err) => console.error("IndexNow project create error:", err));
      submitToGoogleIndex([url]).catch((err) => console.error("Google Indexing project create error:", err));
    }
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

    const data = await updateProject(projectRepo, input);

    revalidatePaths(data?.slug);
    if (data && data.isPublished && data.slug) {
      const url = `https://dienmayelc.com.vn/du-an/${data.slug}`;
      submitToIndexNow([url]).catch((err) => console.error("IndexNow project update error:", err));
      submitToGoogleIndex([url]).catch((err) => console.error("Google Indexing project update error:", err));
    }
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
    const proj = await getProjectById(projectRepo, id);
    await deleteProject(projectRepo, id);
    revalidatePaths(proj?.slug);
    return { error: null };
  } catch (error) {
    console.error("deleteProjectAction error:", error);
    return { error: "Failed to delete project" };
  }
}

export async function toggleProjectPublishAction(id: string, isPublished: boolean) {
  try {
    await toggleProjectPublish(projectRepo, id, isPublished);
    const proj = await getProjectById(projectRepo, id);
    revalidatePaths(proj?.slug);
    if (isPublished && proj?.slug) {
      const url = `https://dienmayelc.com.vn/du-an/${proj.slug}`;
      submitToIndexNow([url]).catch((err) => console.error("IndexNow project toggle error:", err));
      submitToGoogleIndex([url]).catch((err) => console.error("Google Indexing project toggle error:", err));
    }
    return { error: null };
  } catch (error) {
    console.error("toggleProjectPublishAction error:", error);
    return { error: "Failed to toggle publish status" };
  }
}

export async function toggleProjectFeaturedAction(id: string, isFeatured: boolean) {
  try {
    const proj = await getProjectById(projectRepo, id);
    await toggleProjectFeatured(projectRepo, id, isFeatured);
    revalidatePaths(proj?.slug);
    return { error: null };
  } catch (error) {
    console.error("toggleProjectFeaturedAction error:", error);
    return { error: "Failed to toggle featured status" };
  }
}

export async function updateProjectOrderAction(id: string, orderIndex: number) {
  try {
    const proj = await getProjectById(projectRepo, id);
    await updateProjectOrder(projectRepo, id, orderIndex);
    revalidatePaths(proj?.slug);
    return { error: null };
  } catch (error) {
    console.error("updateProjectOrderAction error:", error);
    return { error: "Failed to update project order" };
  }
}

function revalidatePaths(slug?: string) {
  revalidatePath("/admin/projects");
  revalidatePath("/du-an", "layout");
  revalidateTag("projects-list", { expire: 0 });
  if (slug) {
    revalidateTag(`slug:${slug}`, { expire: 0 });
  }
}
