"use server";

import { revalidatePath } from "next/cache";
import { authHeaders, toSnakeCaseBody } from "@/shared/lib/go-api";
import { logEventAction } from "@/modules/event";
import {
  CreateInquiryInput,
  Inquiry,
  InquiryFilter,
  UpdateInquiryStatusInput,
} from "../domain";

const GO_API_URL = process.env.GO_API_URL;

interface GoInquiryResponse {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  message: string | null;
  product_id: string | null;
  project_id: string | null;
  service_id: string | null;
  status: string;
  internal_note: string | null;
  created_at: string;
  updated_at: string;
}

interface GoErrorResponse {
  code: string;
  message: string;
  fields?: Record<string, string[]>;
}

function mapGoInquiry(row: GoInquiryResponse): Inquiry {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    message: row.message,
    productId: row.product_id,
    projectId: row.project_id,
    serviceId: row.service_id,
    status: row.status as Inquiry["status"],
    internalNote: row.internal_note,
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

// Public — submitted anonymously from the site's lead-capture form. No
// authHeaders(): Go's rate limiter + honeypot field are the actual defense
// here (see elc-go internal/inquiry/presentation/handler.go), not auth.
export async function createInquiryAction(input: CreateInquiryInput) {
  if (!GO_API_URL) {
    return { data: null, error: "GO_API_URL is not configured" };
  }
  try {
    const res = await fetch(`${GO_API_URL}/inquiries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toSnakeCaseBody(input)),
    });
    if (!res.ok) {
      return { data: null, error: await extractErrorMessage(res) };
    }

    const row = (await res.json()) as GoInquiryResponse;
    const inquiry = mapGoInquiry(row);

    // Fires the funnel's other half — see modules/event/domain: view_item
    // (on the detail page) -> generate_lead (here) lets the dashboard show
    // a real view-to-lead conversion rate per product/category, not just
    // raw counts. Fire-and-forget, same as any other event.
    if (inquiry.productId) {
      void logEventAction({ name: "generate_lead", entityType: "product", entityId: inquiry.productId });
    } else if (inquiry.projectId) {
      void logEventAction({ name: "generate_lead", entityType: "project", entityId: inquiry.projectId });
    } else if (inquiry.serviceId) {
      void logEventAction({ name: "generate_lead", entityType: "service", entityId: inquiry.serviceId });
    }

    return { data: inquiry, error: null };
  } catch (error) {
    console.error("createInquiryAction error:", error);
    return { data: null, error: "Không thể gửi yêu cầu, vui lòng thử lại." };
  }
}

// Admin-only from here down.

export async function getInquiriesAction(filter?: InquiryFilter) {
  if (!GO_API_URL) {
    return { data: [] as Inquiry[], error: null };
  }
  try {
    const params = new URLSearchParams();
    if (filter?.status) params.set("status", filter.status);
    if (filter?.search) params.set("search", filter.search);

    const res = await fetch(`${GO_API_URL}/inquiries?${params.toString()}`, {
      headers: await authHeaders(),
      cache: "no-store",
    });
    if (!res.ok) {
      return { data: [], error: await extractErrorMessage(res) };
    }

    const rows = (await res.json()) as GoInquiryResponse[] | null;
    return { data: (rows ?? []).map(mapGoInquiry), error: null };
  } catch (error) {
    console.error("getInquiriesAction error:", error);
    return { data: [], error: "Failed to fetch inquiries" };
  }
}

export async function countInquiriesAction(filter?: InquiryFilter) {
  if (!GO_API_URL) {
    return { data: 0, error: null };
  }
  try {
    const params = new URLSearchParams();
    if (filter?.status) params.set("status", filter.status);

    const res = await fetch(`${GO_API_URL}/inquiries/count?${params.toString()}`, {
      headers: await authHeaders(),
      cache: "no-store",
    });
    if (!res.ok) {
      return { data: 0, error: await extractErrorMessage(res) };
    }

    const body = (await res.json()) as { count: number };
    return { data: body.count, error: null };
  } catch (error) {
    console.error("countInquiriesAction error:", error);
    return { data: 0, error: "Failed to count inquiries" };
  }
}

export async function getInquiryByIdAction(id: string) {
  if (!GO_API_URL) {
    return { data: null, error: "GO_API_URL is not configured" };
  }
  try {
    const res = await fetch(`${GO_API_URL}/inquiries/${id}`, {
      headers: await authHeaders(),
      cache: "no-store",
    });
    if (!res.ok) {
      return { data: null, error: await extractErrorMessage(res) };
    }

    const row = (await res.json()) as GoInquiryResponse;
    return { data: mapGoInquiry(row), error: null };
  } catch (error) {
    console.error("getInquiryByIdAction error:", error);
    return { data: null, error: "Failed to fetch inquiry" };
  }
}

export async function updateInquiryStatusAction(input: UpdateInquiryStatusInput) {
  if (!GO_API_URL) {
    return { data: null, error: "GO_API_URL is not configured" };
  }
  try {
    const { id, ...rest } = input;
    const res = await fetch(`${GO_API_URL}/inquiries/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
      body: JSON.stringify(toSnakeCaseBody(rest)),
    });
    if (!res.ok) {
      return { data: null, error: await extractErrorMessage(res) };
    }

    const row = (await res.json()) as GoInquiryResponse;
    revalidatePath("/admin/inquiries");
    return { data: mapGoInquiry(row), error: null };
  } catch (error) {
    console.error("updateInquiryStatusAction error:", error);
    return { data: null, error: "Failed to update inquiry" };
  }
}
