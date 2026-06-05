"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import {
  createCategoryNew,
  deleteCategoryNew,
  getCategoriesNew,
  updateCategoryNew,
} from "../application/index";
import { CreateCategoryNewInput, UpdateCategoryNewInput } from "../domain/types";

export async function getCategoriesNewAction() {
  try {
    const data = await getCategoriesNew();
    return { data, error: null };
  } catch (error) {
    unstable_rethrow(error);
    console.error("getCategoriesNewAction error:", error);
    return { data: [], error: "Failed to fetch custom categories" };
  }
}

export async function createCategoryNewAction(input: CreateCategoryNewInput) {
  try {
    const data = await createCategoryNew(input);
    revalidatePath("/admin/categories");
    return { data, error: null };
  } catch (error) {
    console.error("createCategoryNewAction error:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to create custom category",
    };
  }
}

export async function updateCategoryNewAction(input: UpdateCategoryNewInput) {
  try {
    const data = await updateCategoryNew(input);
    revalidatePath("/admin/categories");
    return { data, error: null };
  } catch (error) {
    console.error("updateCategoryNewAction error:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to update custom category",
    };
  }
}

export async function deleteCategoryNewAction(id: string) {
  try {
    await deleteCategoryNew(id);
    revalidatePath("/admin/categories");
    return { error: null };
  } catch (error) {
    console.error("deleteCategoryNewAction error:", error);
    return {
      error: error instanceof Error ? error.message : "Failed to delete custom category",
    };
  }
}
