"use server";

import { revalidatePath } from "next/cache";
import { authHeaders, clientIpHeaders, toSnakeCaseBody } from "@/shared/lib/go-api";
import { readAttribution, readGAClientID } from "@/shared/lib/attribution";
import { logEventAction } from "@/modules/event";
import {
  CreateInquiryInput,
  Inquiry,
  InquiryFilter,
  UpdateInquiryDetailsInput,
  UpdateInquiryStatusInput,
} from "../domain";
import { GoInquiryResponse, mapGoInquiry } from "../infrastructure/go-mapper";

const GO_API_URL = process.env.GO_API_URL;

interface GoErrorResponse {
  code: string;
  message: string;
  fields?: Record<string, string[]>;
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
export async function createInquiryAction(
  input: CreateInquiryInput,
) {
  if (!GO_API_URL) {
    return { data: null, error: "GO_API_URL is not configured" };
  }
  try {
    // The on-site form is the "form" channel — always has name/phone, so
    // it's the one channel fully wired end-to-end today. gclid/utm* come
    // from middleware.ts's attribution cookie (set on arrival from an ad,
    // read here rather than round-tripped through the client); gaClientId
    // from GA4's own _ga cookie — both needed to tie a later "converted"
    // outcome back to the campaign/session that produced this lead.
    const [attribution, gaClientId] = await Promise.all([
      readAttribution(),
      readGAClientID(),
    ]);
    const payload = {
      ...input,
      channel: "form" as const,
      gclid: attribution?.gclid,
      utmSource: attribution?.utmSource,
      utmMedium: attribution?.utmMedium,
      utmCampaign: attribution?.utmCampaign,
      utmTerm: attribution?.utmTerm,
      utmContent: attribution?.utmContent,
      gaClientId,
    };

    const res = await fetch(`${GO_API_URL}/inquiries`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await clientIpHeaders()) },
      body: JSON.stringify(toSnakeCaseBody(payload)),
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
    if (filter?.from) params.set("from", filter.from);
    if (filter?.to) params.set("to", filter.to);

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

// Separate PATCH from updateInquiryStatusAction — see elc-go's
// UpdateInquiryDetailsInput doc comment. InquiryManagement calls this one
// first, then updateInquiryStatusAction, so a status change to "converted"
// always sees the conversion_value just saved in the same "Lưu thay đổi"
// click, not a stale one from before it.
export async function updateInquiryDetailsAction(input: UpdateInquiryDetailsInput) {
  if (!GO_API_URL) {
    return { data: null, error: "GO_API_URL is not configured" };
  }
  try {
    const { id, ...rest } = input;
    const res = await fetch(`${GO_API_URL}/inquiries/${id}`, {
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
    console.error("updateInquiryDetailsAction error:", error);
    return { data: null, error: "Failed to update inquiry" };
  }
}

export interface AttachmentLink {
  url: string;
  name: string;
  size?: number;
  type?: string;
}

/**
 * A short-lived link (5 minutes) to one of a lead's files, by its position. `expired` means
 * the file is gone: customer files are dropped after 12 months, and the admin says so
 * instead of showing a broken image.
 */
export async function getInquiryAttachmentLinkAction(
  inquiryId: string,
  index: number,
): Promise<{ data: AttachmentLink | null; expired: boolean; error: string | null }> {
  if (!GO_API_URL) return { data: null, expired: false, error: "GO_API_URL is not configured" };
  try {
    const res = await fetch(`${GO_API_URL}/inquiries/${encodeURIComponent(inquiryId)}/attachments/${index}`, {
      headers: await authHeaders(),
      cache: "no-store",
    });
    if (res.status === 404) return { data: null, expired: true, error: null };
    if (!res.ok) return { data: null, expired: false, error: await extractErrorMessage(res) };
    const body = (await res.json()) as AttachmentLink;
    return { data: { url: body.url, name: body.name, size: body.size, type: body.type }, expired: false, error: null };
  } catch (error) {
    console.error("getInquiryAttachmentLinkAction error:", error);
    return { data: null, expired: false, error: "Không lấy được tệp." };
  }
}
