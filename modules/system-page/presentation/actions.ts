"use server";

import { revalidatePath } from "next/cache";
import { getSystemPages, updateSystemPage, UpdateSystemPageInput } from "@/modules/system-page";
import { systemPageRepo } from "../infrastructure/SupabaseSystemPageRepository";

export async function getSystemPagesAction() {
  try {
    const data = await getSystemPages(systemPageRepo);
    return { data, error: null };
  } catch (error) {
    console.error("getSystemPagesAction error:", error);
    return { data: [], error: "Failed to fetch system pages" };
  }
}

export async function updateSystemPageAction(input: UpdateSystemPageInput) {
  try {
    const data = await updateSystemPage(systemPageRepo, input);
    
    // Revalidate paths based on slug
    revalidatePath("/admin/system-pages");
    if (data.slug === "home") {
      revalidatePath("/");
    } else {
      revalidatePath(`/${data.slug}`);
    }

    return { data, error: null };
  } catch (error) {
    console.error("updateSystemPageAction error:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to update system page",
    };
  }
}
