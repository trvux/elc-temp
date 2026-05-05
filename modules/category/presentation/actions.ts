"use server";

import { revalidatePath } from "next/cache";
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from "../application/index";
import {
  CategoryType,
  CreateCategoryInput,
  UpdateCategoryInput,
} from "../domain/index";


export async function getCategoriesAction(type?: CategoryType) {
  try {
    const data = await getCategories({ type });

    return { data, error: null };
  } catch (error) {
    console.error("getCategoriesAction error:", error);
    return { data: [], error: "Failed to fetch categories" };
  }
}

export async function createCategoryAction(input: CreateCategoryInput) {
  try {
    const data = await createCategory(input);
    revalidatePath("/admin/categories");
    revalidatePath("/san-pham");
    revalidatePath("/du-an");
    return { data, error: null };
  } catch (error) {
    console.error("createCategoryAction error:", error);
    return {
      data: null,
      error:
        error instanceof Error ? error.message : "Failed to create category",
    };
  }
}

export async function updateCategoryAction(input: UpdateCategoryInput) {
  try {
    const data = await updateCategory(input);
    revalidatePath("/admin/categories");
    revalidatePath("/san-pham");
    revalidatePath("/du-an");
    return { data, error: null };
  } catch (error) {
    console.error("updateCategoryAction error:", error);
    return {
      data: null,
      error:
        error instanceof Error ? error.message : "Failed to update category",
    };
  }
}

export async function deleteCategoryAction(id: string) {
  try {
    await deleteCategory(id);
    revalidatePath("/admin/categories");
    revalidatePath("/san-pham");
    revalidatePath("/du-an");
    return { error: null };
  } catch (error) {
    console.error("deleteCategoryAction error:", error);
    return {
      error:
        error instanceof Error ? error.message : "Failed to delete category",
    };
  }
}
