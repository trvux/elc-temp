"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { updateSettings } from "../application";
import { SiteSetting } from "../domain";
import { settingsRepo } from "../infrastructure/settingsRepo";

export async function updateSettingsAction(settings: SiteSetting[]) {
  try {
    await updateSettings(settingsRepo, settings);
    revalidatePath("/admin/settings");
    revalidatePath("/", "layout");
    revalidateTag("layout", { expire: 0 });
    return { success: true, error: null };
  } catch (error) {
    console.error("updateSettingsAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update settings",
    };
  }
}
