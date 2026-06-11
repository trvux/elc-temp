"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { 
  getNews, 
  createNews, 
  updateNews, 
  deleteNews 
} from "../application/index";
import { 
  CreateNewsInput, 
  UpdateNewsInput 
} from "../domain/index";

export async function getNewsAction(options?: {
  isPublished?: boolean;
}) {
  try {
    const data = await getNews(options);
    return { data, error: null };
  } catch (error) {
    console.error("getNewsAction error:", error);
    return { data: [], error: "Failed to fetch news" };
  }
}

export async function createNewsAction(input: CreateNewsInput) {
  try {
    const data = await createNews(input);
    revalidatePath("/admin/news");
    revalidatePath("/tin-tuc");
    revalidateTag("news", { expire: 0 });
    return { data, error: null };
  } catch (error) {
    console.error("createNewsAction error:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to create news",
    };
  }
}

export async function updateNewsAction(input: UpdateNewsInput) {
  try {
    const data = await updateNews(input);
    revalidatePath("/admin/news");
    revalidatePath("/tin-tuc");
    revalidatePath(`/tin-tuc/${data.slug}`);
    revalidateTag("news", { expire: 0 });
    return { data, error: null };
  } catch (error) {
    console.error("updateNewsAction error:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to update news",
    };
  }
}

export async function deleteNewsAction(id: string) {
  try {
    await deleteNews(id);
    revalidatePath("/admin/news");
    revalidatePath("/tin-tuc");
    revalidateTag("news", { expire: 0 });
    return { success: true, error: null };
  } catch (error) {
    console.error("deleteNewsAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete news",
    };
  }
}
