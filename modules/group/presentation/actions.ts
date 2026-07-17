"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { Group, GroupFilter, CreateGroupInput, UpdateGroupInput } from "../domain";
import { authHeaders, toSnakeCaseBody } from "@/shared/lib/go-api";
import { purgeCloudflareCache } from "@/shared/lib/cloudflare-purge";

const GO_API_URL = process.env.GO_API_URL;

interface GoGroupResponse {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  meta_title: string | null;
  meta_description: string | null;
  is_featured: boolean;
  order_index: number;
  content: unknown | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface GoErrorResponse {
  code: string;
  message: string;
  fields?: Record<string, string[]>;
}

function mapGoGroup(row: GoGroupResponse): Group {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    imageUrl: row.image_url,
    metaTitle: row.meta_title,
    metaDescription: row.meta_description,
    isFeatured: row.is_featured,
    orderIndex: row.order_index,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

async function extractErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const body = (await res.json()) as GoErrorResponse;
    return body.message || fallback;
  } catch {
    return fallback;
  }
}

export async function getGroupsAction(options?: GroupFilter) {
  if (!GO_API_URL) {
    return { data: [] as Group[], error: null };
  }
  try {
    const params = new URLSearchParams();
    if (options?.search) params.set("search", options.search);
    if (options?.limit) params.set("limit", String(options.limit));
    if (options?.offset) params.set("offset", String(options.offset));
    if (options?.includeDeleted) params.set("include_deleted", "true");

    const res = await fetch(`${GO_API_URL}/groups?${params.toString()}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      return { data: [] as Group[], error: await extractErrorMessage(res, "Failed to fetch groups") };
    }

    const rows = (await res.json()) as GoGroupResponse[] | null;
    return { data: (rows ?? []).map(mapGoGroup), error: null };
  } catch (error) {
    console.error("getGroupsAction error:", error);
    return { data: [] as Group[], error: "Failed to fetch groups" };
  }
}

export async function getGroupByIdAction(id: string) {
  if (!GO_API_URL) {
    return { data: null, error: null };
  }
  try {
    const res = await fetch(`${GO_API_URL}/groups/${id}`, { cache: "no-store" });
    if (res.status === 404) {
      return { data: null, error: null };
    }
    if (!res.ok) {
      return { data: null, error: await extractErrorMessage(res, "Failed to fetch group") };
    }

    const row = (await res.json()) as GoGroupResponse;
    return { data: mapGoGroup(row), error: null };
  } catch (error) {
    console.error("getGroupByIdAction error:", error);
    return { data: null, error: "Failed to fetch group" };
  }
}

export async function createGroupAction(input: CreateGroupInput) {
  if (!GO_API_URL) {
    return { data: null, error: "GO_API_URL is not configured" };
  }
  try {
    const res = await fetch(`${GO_API_URL}/groups`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
      body: JSON.stringify(toSnakeCaseBody(input)),
    });
    if (!res.ok) {
      return { data: null, error: await extractErrorMessage(res, "Failed to create group") };
    }

    const row = (await res.json()) as GoGroupResponse;
    revalidatePath("/admin/group-categories");
    revalidateTag("layout", { expire: 0 });
    revalidateTag("products", { expire: 0 });
    await purgeCloudflareCache();
    return { data: mapGoGroup(row), error: null };
  } catch (error) {
    console.error("createGroupAction error:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to create group",
    };
  }
}

export async function updateGroupAction(input: UpdateGroupInput) {
  if (!GO_API_URL) {
    return { data: null, error: "GO_API_URL is not configured" };
  }
  try {
    const { id, ...rest } = input;
    const res = await fetch(`${GO_API_URL}/groups/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
      body: JSON.stringify(toSnakeCaseBody(rest)),
    });
    if (!res.ok) {
      return { data: null, error: await extractErrorMessage(res, "Failed to update group") };
    }

    const row = (await res.json()) as GoGroupResponse;
    revalidatePath("/admin/group-categories");
    revalidateTag("layout", { expire: 0 });
    revalidateTag("products", { expire: 0 });
    await purgeCloudflareCache();
    return { data: mapGoGroup(row), error: null };
  } catch (error) {
    console.error("updateGroupAction error:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to update group",
    };
  }
}

export async function deleteGroupAction(id: string) {
  if (!GO_API_URL) {
    return { error: "GO_API_URL is not configured" };
  }
  try {
    const res = await fetch(`${GO_API_URL}/groups/${id}`, { method: "DELETE", headers: await authHeaders() });
    if (!res.ok) {
      return { error: await extractErrorMessage(res, "Failed to delete group") };
    }

    revalidatePath("/admin/group-categories");
    revalidateTag("layout", { expire: 0 });
    revalidateTag("products", { expire: 0 });
    await purgeCloudflareCache();
    return { error: null };
  } catch (error) {
    console.error("deleteGroupAction error:", error);
    return {
      error: error instanceof Error ? error.message : "Failed to delete group",
    };
  }
}
