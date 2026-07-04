"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { ServiceGroup, CreateServiceGroupInput, UpdateServiceGroupInput } from "../domain/types";
import { toSnakeCaseBody } from "@/shared/lib/go-api";
import { purgeCloudflareCache } from "@/shared/lib/cloudflare-purge";

const GO_API_URL = process.env.GO_API_URL;

interface GoServiceGroupResponse {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  meta_title: string | null;
  meta_description: string | null;
  is_featured: boolean;
  order_index: number;
  category_ids: string[] | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface GoErrorResponse {
  code: string;
  message: string;
  fields?: Record<string, string[]>;
}

function mapGoServiceGroup(row: GoServiceGroupResponse): ServiceGroup {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    imageUrl: row.image_url,
    metaTitle: row.meta_title,
    metaDescription: row.meta_description,
    isFeatured: row.is_featured,
    orderIndex: row.order_index,
    categoryIds: row.category_ids,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

async function extractErrorMessage(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as GoErrorResponse;
    return body.message || `Go API error (${res.status})`;
  } catch {
    return `Go API error (${res.status})`;
  }
}

export async function getServiceGroupsAction() {
  if (!GO_API_URL) {
    return { data: [] as ServiceGroup[], error: null };
  }
  try {
    const res = await fetch(`${GO_API_URL}/service-groups`, { cache: "no-store" });
    if (!res.ok) {
      return { data: [], error: await extractErrorMessage(res) };
    }

    const rows = (await res.json()) as GoServiceGroupResponse[] | null;
    return { data: (rows ?? []).map(mapGoServiceGroup), error: null };
  } catch (error) {
    console.error("getServiceGroupsAction error:", error);
    return { data: [], error: "Failed to fetch service groups" };
  }
}

export async function createServiceGroupAction(input: CreateServiceGroupInput) {
  if (!GO_API_URL) {
    return { data: null, error: "GO_API_URL is not configured" };
  }
  try {
    const res = await fetch(`${GO_API_URL}/service-groups`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toSnakeCaseBody(input)),
    });
    if (!res.ok) {
      return { data: null, error: await extractErrorMessage(res) };
    }

    const row = (await res.json()) as GoServiceGroupResponse;
    revalidatePath("/admin/service-groups");
    revalidateTag("layout", { expire: 0 });
    revalidateTag("services", { expire: 0 });
    await purgeCloudflareCache();
    return { data: mapGoServiceGroup(row), error: null };
  } catch (error) {
    console.error("createServiceGroupAction error:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to create service group",
    };
  }
}

export async function updateServiceGroupAction(input: UpdateServiceGroupInput) {
  if (!GO_API_URL) {
    return { data: null, error: "GO_API_URL is not configured" };
  }
  try {
    const { id, ...rest } = input;
    const res = await fetch(`${GO_API_URL}/service-groups/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toSnakeCaseBody(rest)),
    });
    if (!res.ok) {
      return { data: null, error: await extractErrorMessage(res) };
    }

    const row = (await res.json()) as GoServiceGroupResponse;
    revalidatePath("/admin/service-groups");
    revalidateTag("layout", { expire: 0 });
    revalidateTag("services", { expire: 0 });
    await purgeCloudflareCache();
    return { data: mapGoServiceGroup(row), error: null };
  } catch (error) {
    console.error("updateServiceGroupAction error:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to update service group",
    };
  }
}

export async function deleteServiceGroupAction(id: string) {
  if (!GO_API_URL) {
    return { error: "GO_API_URL is not configured" };
  }
  try {
    const res = await fetch(`${GO_API_URL}/service-groups/${id}`, { method: "DELETE" });
    if (!res.ok) {
      return { error: await extractErrorMessage(res) };
    }

    revalidatePath("/admin/service-groups");
    revalidateTag("layout", { expire: 0 });
    revalidateTag("services", { expire: 0 });
    await purgeCloudflareCache();
    return { error: null };
  } catch (error) {
    console.error("deleteServiceGroupAction error:", error);
    return {
      error: error instanceof Error ? error.message : "Failed to delete service group",
    };
  }
}
