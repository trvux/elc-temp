"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import {
  createBranch,
  deleteBranch,
  getBranches,
  updateBranch,
  countBranches,
  updateBranchOrder,
} from "../application";
import { CreateBranchInput, UpdateBranchInput, BranchFilter } from "../domain";
import { branchRepo } from "../infrastructure/branchRepo";

export async function getBranchesAction(options?: BranchFilter) {
  try {
    const data = await getBranches(branchRepo, options);
    return { data, error: null };
  } catch (error) {
    console.error("getBranchesAction error:", error);
    return { data: [], error: "Failed to fetch branches" };
  }
}

export async function getBranchesWithCountAction(options?: BranchFilter) {
  try {
    const [data, total] = await Promise.all([
      getBranches(branchRepo, options),
      countBranches(branchRepo, options),
    ]);
    return { data, total, error: null };
  } catch (error) {
    console.error("getBranchesWithCountAction error:", error);
    return { data: [], total: 0, error: "Failed to fetch branches with count" };
  }
}

export async function createBranchAction(input: CreateBranchInput) {
  try {
    const data = await createBranch(branchRepo, input);
    revalidatePath("/admin/branches");
    revalidatePath("/co-so-ha-tang");
    revalidatePath("/thong-tin");
    revalidateTag("layout", { expire: 0 });
    return { data, error: null };
  } catch (error) {
    console.error("createBranchAction error:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to create branch",
    };
  }
}

export async function updateBranchAction(input: UpdateBranchInput) {
  try {
    const data = await updateBranch(branchRepo, input);
    revalidatePath("/admin/branches");
    revalidatePath("/co-so-ha-tang");
    revalidatePath("/thong-tin");
    revalidateTag("layout", { expire: 0 });
    return { data, error: null };
  } catch (error) {
    console.error("updateBranchAction error:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to update branch",
    };
  }
}

export async function deleteBranchAction(id: string) {
  try {
    await deleteBranch(branchRepo, id);
    revalidatePath("/admin/branches");
    revalidatePath("/co-so-ha-tang");
    revalidatePath("/thong-tin");
    revalidateTag("layout", { expire: 0 });
    return { success: true, error: null };
  } catch (error) {
    console.error("deleteBranchAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete branch",
    };
  }
}

export async function updateBranchOrderAction(id: string, orderIndex: number) {
  try {
    await updateBranchOrder(branchRepo, id, orderIndex);
    revalidatePath("/admin/branches");
    revalidateTag("layout", { expire: 0 });
    return { success: true, error: null };
  } catch (error) {
    console.error("updateBranchOrderAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? orderIndex.toString() : "Failed to update order",
    };
  }
}
