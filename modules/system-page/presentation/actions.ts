"use server";

import { revalidatePath } from "next/cache";
import { SystemPage, UpdateSystemPageInput } from "../domain";
import { authHeaders, toSnakeCaseBody } from "@/shared/lib/go-api";

const GO_API_URL = process.env.GO_API_URL;

interface GoSystemPageResponse {
  id: string;
  name: string;
  slug: string;
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
  updated_at: string;
}

interface GoErrorResponse {
  code: string;
  message: string;
}

function mapSystemPageToDomain(row: GoSystemPageResponse): SystemPage {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    metaTitle: row.meta_title,
    metaDescription: row.meta_description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
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

export async function getSystemPagesAction() {
  if (!GO_API_URL) {
    return { data: [] as SystemPage[], error: null };
  }
  try {
    const res = await fetch(`${GO_API_URL}/system-pages`, { cache: "no-store" });
    if (!res.ok) {
      return { data: [], error: await extractErrorMessage(res, "Failed to fetch system pages") };
    }
    const rows = (await res.json()) as GoSystemPageResponse[] | null;
    return { data: (rows ?? []).map(mapSystemPageToDomain), error: null };
  } catch (error) {
    if (isPrerenderError(error)) throw error;
    console.error("getSystemPagesAction error:", error);
    return { data: [], error: "Failed to fetch system pages" };
  }
}

export async function getSystemPageBySlugAction(slug: string) {
  if (!GO_API_URL) {
    return { data: null as SystemPage | null, error: null };
  }
  try {
    const res = await fetch(`${GO_API_URL}/system-pages/slug/${slug}`, { cache: "no-store" });
    if (!res.ok) {
      if (res.status === 404) {
        return { data: null, error: null };
      }
      return { data: null, error: await extractErrorMessage(res, "Failed to fetch system page") };
    }
    const row = (await res.json()) as GoSystemPageResponse;
    return { data: mapSystemPageToDomain(row), error: null };
  } catch (error) {
    if (isPrerenderError(error)) throw error;
    console.error("getSystemPageBySlugAction error:", error);
    return { data: null, error: "Failed to fetch system page" };
  }
}

export async function updateSystemPageAction(input: UpdateSystemPageInput) {
  if (!GO_API_URL) {
    return { data: null, error: "GO_API_URL is not configured" };
  }
  try {
    const res = await fetch(`${GO_API_URL}/system-pages/${input.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
      body: JSON.stringify(toSnakeCaseBody({ metaTitle: input.metaTitle, metaDescription: input.metaDescription })),
    });
    if (!res.ok) {
      return { data: null, error: await extractErrorMessage(res, "Failed to update system page") };
    }
    const row = (await res.json()) as GoSystemPageResponse;
    const data = mapSystemPageToDomain(row);

    revalidatePath("/admin/system-pages");
    if (data.slug === "home") {
      revalidatePath("/");
    } else {
      revalidatePath(`/${data.slug}`);
    }

    return { data, error: null };
  } catch (error) {
    if (isPrerenderError(error)) throw error;
    console.error("updateSystemPageAction error:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to update system page",
    };
  }
}
