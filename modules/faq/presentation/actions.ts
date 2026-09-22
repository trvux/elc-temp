"use server";

import { revalidateTag } from "next/cache";
import { authHeaders, toSnakeCaseBody } from "@/shared/lib/go-api";
import { CreateFAQInput, FAQ, FAQOwnerType, UpdateFAQInput } from "../domain/types";

const GO_API_URL = process.env.GO_API_URL;

interface GoFAQResponse {
  id: string;
  owner_type: string;
  owner_id: string;
  question: string;
  answer: string;
  order_index: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

interface GoErrorResponse {
  code: string;
  message: string;
  fields?: Record<string, string[]>;
}

function mapGoFAQ(row: GoFAQResponse): FAQ {
  return {
    id: row.id,
    ownerType: row.owner_type as FAQOwnerType,
    ownerId: row.owner_id,
    question: row.question,
    answer: row.answer,
    orderIndex: row.order_index,
    isPublished: row.is_published,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
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

// Public read — published FAQs only, feeds both the visible accordion and
// the FAQPage JSON-LD block on the same page.
export async function getFAQsAction(ownerType: FAQOwnerType, ownerId: string) {
  if (!GO_API_URL) {
    return { data: [] as FAQ[], error: null };
  }
  try {
    const res = await fetch(`${GO_API_URL}/faqs/${ownerType}/${ownerId}`, { cache: "no-store" });
    if (!res.ok) {
      return { data: [], error: await extractErrorMessage(res) };
    }

    const rows = (await res.json()) as GoFAQResponse[] | null;
    return { data: (rows ?? []).map(mapGoFAQ), error: null };
  } catch (error) {
    console.error("getFAQsAction error:", error);
    return { data: [], error: "Failed to fetch FAQs" };
  }
}

// Admin read — everything for one owner, including unpublished drafts, for
// the FAQ management section embedded in that owner's own edit screen.
export async function getAdminFAQsAction(ownerType: FAQOwnerType, ownerId: string) {
  if (!GO_API_URL) {
    return { data: [] as FAQ[], error: null };
  }
  try {
    const res = await fetch(`${GO_API_URL}/admin/faqs/${ownerType}/${ownerId}`, {
      headers: await authHeaders(),
      cache: "no-store",
    });
    if (!res.ok) {
      return { data: [], error: await extractErrorMessage(res) };
    }

    const rows = (await res.json()) as GoFAQResponse[] | null;
    return { data: (rows ?? []).map(mapGoFAQ), error: null };
  } catch (error) {
    console.error("getAdminFAQsAction error:", error);
    return { data: [], error: "Failed to fetch FAQs" };
  }
}

// revalidatePathsFor maps an owner type to the public route(s) whose page
// needs a fresh render after a FAQ write — same "revalidate the actual
// public page" posture the owning module's own create/update actions use.
function revalidatePathsFor(ownerType: FAQOwnerType) {
  switch (ownerType) {
    case "service":
      revalidateTag("services", { expire: 0 });
      return;
    case "product":
      revalidateTag("products", { expire: 0 });
      return;
    case "project":
      revalidateTag("projects", { expire: 0 });
      return;
    case "news":
      revalidateTag("news", { expire: 0 });
      return;
    default:
      revalidateTag("layout", { expire: 0 });
  }
}

export async function createFAQAction(input: CreateFAQInput) {
  if (!GO_API_URL) {
    return { data: null, error: "GO_API_URL is not configured" };
  }
  try {
    const res = await fetch(`${GO_API_URL}/admin/faqs`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
      body: JSON.stringify(toSnakeCaseBody(input)),
    });
    if (!res.ok) {
      return { data: null, error: await extractErrorMessage(res) };
    }

    const row = (await res.json()) as GoFAQResponse;
    revalidatePathsFor(input.ownerType);
    return { data: mapGoFAQ(row), error: null };
  } catch (error) {
    console.error("createFAQAction error:", error);
    return { data: null, error: error instanceof Error ? error.message : "Failed to create FAQ" };
  }
}

export async function updateFAQAction(input: UpdateFAQInput, ownerType: FAQOwnerType) {
  if (!GO_API_URL) {
    return { data: null, error: "GO_API_URL is not configured" };
  }
  try {
    const { id, ...rest } = input;
    const res = await fetch(`${GO_API_URL}/admin/faqs/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
      body: JSON.stringify(toSnakeCaseBody(rest)),
    });
    if (!res.ok) {
      return { data: null, error: await extractErrorMessage(res) };
    }

    const row = (await res.json()) as GoFAQResponse;
    revalidatePathsFor(ownerType);
    return { data: mapGoFAQ(row), error: null };
  } catch (error) {
    console.error("updateFAQAction error:", error);
    return { data: null, error: error instanceof Error ? error.message : "Failed to update FAQ" };
  }
}

export async function deleteFAQAction(id: string, ownerType: FAQOwnerType) {
  if (!GO_API_URL) {
    return { error: "GO_API_URL is not configured" };
  }
  try {
    const res = await fetch(`${GO_API_URL}/admin/faqs/${id}`, {
      method: "DELETE",
      headers: await authHeaders(),
    });
    if (!res.ok) {
      return { error: await extractErrorMessage(res) };
    }

    revalidatePathsFor(ownerType);
    return { error: null };
  } catch (error) {
    console.error("deleteFAQAction error:", error);
    return { error: error instanceof Error ? error.message : "Failed to delete FAQ" };
  }
}
