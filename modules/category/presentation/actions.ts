"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from "../application";
import { CreateCategoryInput, UpdateCategoryInput } from "../domain";
import { categoryRepo } from "../infrastructure/categoryRepo";
import { purgeCloudflareCache } from "@/shared/lib/cloudflare-purge";

export async function getCategoriesAction() {
  try {
    const data = await getCategories(categoryRepo);
    return { data, error: null };
  } catch (error) {
    unstable_rethrow(error);
    console.error("getCategoriesAction error:", error);
    return { data: [], error: "Failed to fetch custom categories" };
  }
}

export async function createCategoryAction(input: CreateCategoryInput) {
  try {
    const data = await createCategory(categoryRepo, input);
    revalidatePath("/admin/categories");
    revalidateTag("layout", { expire: 0 });
    revalidateTag("products", { expire: 0 });
    await purgeCloudflareCache();
    return { data, error: null };
  } catch (error) {
    console.error("createCategoryAction error:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to create custom category",
    };
  }
}

export async function updateCategoryAction(input: UpdateCategoryInput) {
  try {
    const data = await updateCategory(categoryRepo, input);
    revalidatePath("/admin/categories");
    revalidateTag("layout", { expire: 0 });
    revalidateTag("products", { expire: 0 });
    await purgeCloudflareCache();
    return { data, error: null };
  } catch (error) {
    console.error("updateCategoryAction error:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to update custom category",
    };
  }
}

export async function deleteCategoryAction(id: string) {
  try {
    await deleteCategory(categoryRepo, id);
    revalidatePath("/admin/categories");
    revalidateTag("layout", { expire: 0 });
    revalidateTag("products", { expire: 0 });
    await purgeCloudflareCache();
    return { error: null };
  } catch (error) {
    console.error("deleteCategoryAction error:", error);
    return {
      error: error instanceof Error ? error.message : "Failed to delete custom category",
    };
  }
}
