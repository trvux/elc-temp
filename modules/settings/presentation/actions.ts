"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { purgeCloudflareCache } from "@/shared/lib/cloudflare-purge";
import { SiteSetting } from "../domain";

const GO_API_URL = process.env.GO_API_URL;

interface GoSettingResponse {
  key: string;
  value: string;
}

interface GoErrorResponse {
  code: string;
  message: string;
}

function isPrerenderError(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    const name = error.name;
    return (
      name === "AbortError" ||
      msg.includes("aborted") ||
      msg.includes("abort") ||
      msg.includes("prerendering") ||
      msg.includes("prerender")
    );
  }
  return false;
}

async function extractErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const body = (await res.json()) as GoErrorResponse;
    return body.message || fallback;
  } catch {
    return fallback;
  }
}

export async function getSiteSettingsAction() {
  if (!GO_API_URL) {
    return { data: [] as SiteSetting[], error: null };
  }
  try {
    const res = await fetch(`${GO_API_URL}/settings`, { cache: "no-store" });
    if (!res.ok) {
      return { data: [], error: await extractErrorMessage(res, "Không thể tải cấu hình hệ thống") };
    }
    const rows = (await res.json()) as GoSettingResponse[] | null;
    return { data: rows ?? [], error: null };
  } catch (error) {
    if (isPrerenderError(error)) throw error;
    console.error("getSiteSettingsAction error:", error);
    return { data: [], error: "Không thể tải cấu hình hệ thống" };
  }
}

export async function updateSettingsAction(settings: SiteSetting[]) {
  if (!GO_API_URL) {
    return { success: false, error: "GO_API_URL is not configured" };
  }
  try {
    const res = await fetch(`${GO_API_URL}/settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings.map(s => ({ key: s.key, value: s.value }))),
    });
    if (!res.ok) {
      return { success: false, error: await extractErrorMessage(res, "Không thể lưu cài đặt") };
    }

    revalidatePath("/admin/settings");
    revalidatePath("/", "layout");
    revalidateTag("layout", { expire: 0 });
    // "layout" anh huong header/footer tren toan site -> khong the liet ke het URL,
    // purge_everything la lua chon dung va don gian nhat (xem shared/lib/cloudflare-purge.ts)
    await purgeCloudflareCache();
    return { success: true, error: null };
  } catch (error) {
    if (isPrerenderError(error)) throw error;
    console.error("updateSettingsAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Không thể lưu cài đặt",
    };
  }
}
