"use server";

import { revalidatePath } from "next/cache";
import { authHeaders } from "@/shared/lib/go-api";
import type {
  CreateRedirectInput,
  Redirect,
  RedirectList,
  RedirectQuery,
  RedirectSource,
  UpdateRedirectInput,
} from "../domain/types";

const GO_API_URL = process.env.GO_API_URL;

interface GoRedirect {
  id: string;
  from_path: string;
  to_path: string;
  is_active: boolean;
  source: RedirectSource;
  note: string;
  created_at: string;
  updated_at: string;
}

function mapRedirect(r: GoRedirect): Redirect {
  return {
    id: r.id,
    fromPath: r.from_path,
    toPath: r.to_path,
    isActive: r.is_active,
    source: r.source,
    note: r.note,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

// Go answers validation failures with { message, fields: { to_path: ["..."] } };
// show the field messages (already written for the admin) when there are any.
async function errorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const body = (await res.json()) as { message?: string; fields?: Record<string, string[]> };
    const detail = Object.values(body.fields ?? {}).flat().join(". ");
    return detail || body.message || fallback;
  } catch {
    return fallback;
  }
}

export async function getRedirectsAction(
  query: RedirectQuery = {},
): Promise<{ data: RedirectList; error: string | null }> {
  const empty: RedirectList = { items: [], total: 0 };
  if (!GO_API_URL) return { data: empty, error: "GO_API_URL is not configured" };
  try {
    const params = new URLSearchParams();
    if (query.q) params.set("q", query.q);
    if (query.source) params.set("source", query.source);
    if (query.limit) params.set("limit", String(query.limit));
    if (query.offset) params.set("offset", String(query.offset));
    const res = await fetch(`${GO_API_URL}/admin/redirects?${params}`, {
      headers: await authHeaders(),
      cache: "no-store",
    });
    if (!res.ok) return { data: empty, error: await errorMessage(res, "Không tải được danh sách chuyển hướng") };
    const body = (await res.json()) as { items: GoRedirect[]; total: number };
    return { data: { items: body.items.map(mapRedirect), total: body.total }, error: null };
  } catch (error) {
    console.error("getRedirectsAction error:", error);
    return { data: empty, error: error instanceof Error ? error.message : "Không tải được danh sách chuyển hướng" };
  }
}

export async function createRedirectAction(input: CreateRedirectInput) {
  if (!GO_API_URL) return { data: null, error: "GO_API_URL is not configured" };
  try {
    const res = await fetch(`${GO_API_URL}/admin/redirects`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
      body: JSON.stringify({ from_path: input.fromPath, to_path: input.toPath, note: input.note ?? "" }),
    });
    if (!res.ok) return { data: null, error: await errorMessage(res, "Không tạo được chuyển hướng") };
    revalidatePath("/admin/redirects");
    return { data: mapRedirect((await res.json()) as GoRedirect), error: null };
  } catch (error) {
    console.error("createRedirectAction error:", error);
    return { data: null, error: error instanceof Error ? error.message : "Không tạo được chuyển hướng" };
  }
}

export async function updateRedirectAction(input: UpdateRedirectInput) {
  if (!GO_API_URL) return { data: null, error: "GO_API_URL is not configured" };
  try {
    const { id, toPath, note, isActive } = input;
    const res = await fetch(`${GO_API_URL}/admin/redirects/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
      body: JSON.stringify({ to_path: toPath, note, is_active: isActive }),
    });
    if (!res.ok) return { data: null, error: await errorMessage(res, "Không cập nhật được chuyển hướng") };
    revalidatePath("/admin/redirects");
    return { data: mapRedirect((await res.json()) as GoRedirect), error: null };
  } catch (error) {
    console.error("updateRedirectAction error:", error);
    return { data: null, error: error instanceof Error ? error.message : "Không cập nhật được chuyển hướng" };
  }
}

export async function deleteRedirectAction(id: string) {
  if (!GO_API_URL) return { error: "GO_API_URL is not configured" };
  try {
    const res = await fetch(`${GO_API_URL}/admin/redirects/${id}`, { method: "DELETE", headers: await authHeaders() });
    if (!res.ok) return { error: await errorMessage(res, "Không xóa được chuyển hướng") };
    revalidatePath("/admin/redirects");
    return { error: null };
  } catch (error) {
    console.error("deleteRedirectAction error:", error);
    return { error: error instanceof Error ? error.message : "Không xóa được chuyển hướng" };
  }
}
