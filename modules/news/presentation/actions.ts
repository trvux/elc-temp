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
import { newsRepo } from "../infrastructure/SupabaseNewsRepository";
import { submitToIndexNow } from "@/shared/lib/indexnow";
import { submitToGoogleIndex } from "@/shared/lib/google-indexing";
import { purgeCloudflareCache } from "@/shared/lib/cloudflare-purge";

export async function getNewsAction(options?: {
  isPublished?: boolean;
}) {
  try {
    const data = await getNews(newsRepo, options);
    return { data, error: null };
  } catch (error) {
    console.error("getNewsAction error:", error);
    return { data: [], error: "Failed to fetch news" };
  }
}

export async function createNewsAction(input: CreateNewsInput) {
  try {
    const data = await createNews(newsRepo, input);
    revalidatePath("/admin/news");
    revalidatePath("/tin-tuc");
    revalidateTag("news-list", { expire: 0 });
    await purgeCloudflareCache();
    if (data?.slug) {
      revalidateTag(`news-slug:${data.slug}`, { expire: 0 });
    }
    if (data?.isPublished && data?.slug) {
      const url = `https://dienmayelc.com.vn/tin-tuc/${data.slug}`;
      submitToIndexNow([url]).catch((err) => console.error("IndexNow news create error:", err));
      submitToGoogleIndex([url]).catch((err) => console.error("Google Indexing news create error:", err));
    }
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
    const data = await updateNews(newsRepo, input);
    revalidatePath("/admin/news");
    revalidatePath("/tin-tuc");
    revalidatePath(`/tin-tuc/${data.slug}`);
    revalidateTag("news-list", { expire: 0 });
    await purgeCloudflareCache();
    if (data?.slug) {
      revalidateTag(`news-slug:${data.slug}`, { expire: 0 });
    }
    if (data?.isPublished && data?.slug) {
      const url = `https://dienmayelc.com.vn/tin-tuc/${data.slug}`;
      submitToIndexNow([url]).catch((err) => console.error("IndexNow news update error:", err));
      submitToGoogleIndex([url]).catch((err) => console.error("Google Indexing news update error:", err));
    }
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
    const newsItem = await newsRepo.getById(id);
    await deleteNews(newsRepo, id);
    revalidatePath("/admin/news");
    revalidatePath("/tin-tuc");
    revalidateTag("news-list", { expire: 0 });
    await purgeCloudflareCache();
    if (newsItem?.slug) {
      revalidateTag(`news-slug:${newsItem.slug}`, { expire: 0 });
      submitToGoogleIndex([`https://dienmayelc.com.vn/tin-tuc/${newsItem.slug}`], "URL_DELETED")
        .catch((err) => console.error("Google Indexing news delete error:", err));
    }
    return { success: true, error: null };
  } catch (error) {
    console.error("deleteNewsAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete news",
    };
  }
}
