"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { Contact, CreateContactInput, UpdateContactInput, ContactFilter } from "../domain";
import { toSnakeCaseBody } from "@/shared/lib/go-api";

const GO_API_URL = process.env.GO_API_URL;

interface GoContactResponse {
  id: string;
  type: string;
  label: string | null;
  value: string;
  is_active: boolean;
  order_index: number;
  href: string;
  is_external: boolean;
}

interface GoErrorResponse {
  code: string;
  message: string;
  fields?: Record<string, string[]>;
}

function mapGoContact(row: GoContactResponse): Contact {
  return {
    id: row.id,
    type: row.type,
    label: row.label,
    value: row.value,
    isActive: row.is_active,
    orderIndex: row.order_index,
    href: row.href,
    isExternal: row.is_external,
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

export async function getContactsAction(options?: ContactFilter) {
  try {
    const params = new URLSearchParams();
    if (options?.type) params.set("type", options.type);
    if (options?.search) params.set("search", options.search);

    const res = await fetch(`${GO_API_URL}/contacts?${params.toString()}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      return { data: [], error: await extractErrorMessage(res) };
    }

    const rows = (await res.json()) as GoContactResponse[] | null;
    return { data: (rows ?? []).map(mapGoContact), error: null };
  } catch (error) {
    console.error("getContactsAction error:", error);
    return { data: [], error: "Failed to fetch contacts" };
  }
}

export async function createContactAction(input: CreateContactInput) {
  try {
    const res = await fetch(`${GO_API_URL}/contacts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toSnakeCaseBody(input)),
    });
    if (!res.ok) {
      return { data: null, error: await extractErrorMessage(res) };
    }

    const row = (await res.json()) as GoContactResponse;
    revalidatePath("/admin/contacts");
    revalidateTag("layout", { expire: 0 });
    return { data: mapGoContact(row), error: null };
  } catch (error) {
    console.error("createContactAction error:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to create contact",
    };
  }
}

export async function updateContactAction(input: UpdateContactInput) {
  try {
    const { id, ...rest } = input;
    const res = await fetch(`${GO_API_URL}/contacts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toSnakeCaseBody(rest)),
    });
    if (!res.ok) {
      return { data: null, error: await extractErrorMessage(res) };
    }

    const row = (await res.json()) as GoContactResponse;
    revalidatePath("/admin/contacts");
    revalidateTag("layout", { expire: 0 });
    return { data: mapGoContact(row), error: null };
  } catch (error) {
    console.error("updateContactAction error:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to update contact",
    };
  }
}

export async function deleteContactAction(id: string) {
  try {
    const res = await fetch(`${GO_API_URL}/contacts/${id}`, { method: "DELETE" });
    if (!res.ok) {
      return { success: false, error: await extractErrorMessage(res) };
    }

    revalidatePath("/admin/contacts");
    revalidateTag("layout", { expire: 0 });
    return { success: true, error: null };
  } catch (error) {
    console.error("deleteContactAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete contact",
    };
  }
}
