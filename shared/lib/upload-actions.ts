"use server";

import { authHeaders } from "@/shared/lib/go-api";

const GO_API_URL = process.env.GO_API_URL;

export async function uploadImageAction(formData: FormData): Promise<{ url: string | null; cropVariants: Record<string, string> | null; error: string | null }> {
  if (!GO_API_URL) {
    return { url: null, cropVariants: null, error: "GO_API_URL is not configured" };
  }
  try {
    const res = await fetch(`${GO_API_URL}/uploads`, {
      method: "POST",
      headers: await authHeaders(),
      body: formData,
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { message?: string } | null;
      return { url: null, cropVariants: null, error: body?.message || `Upload failed (${res.status})` };
    }
    const body = (await res.json()) as { url: string; cropVariants?: Record<string, string> };
    return { url: body.url, cropVariants: body.cropVariants || null, error: null };
  } catch (error) {
    console.error("uploadImageAction error:", error);
    return { url: null, cropVariants: null, error: "Failed to upload image" };
  }
}
