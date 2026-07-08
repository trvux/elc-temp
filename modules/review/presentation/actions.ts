"use server";

import { revalidatePath } from "next/cache";
import { authHeaders, toSnakeCaseBody } from "@/shared/lib/go-api";
import {
  CreateReviewInput,
  PublicReview,
  Review,
  ReviewFilter,
  ReviewSummary,
} from "../domain";

const GO_API_URL = process.env.GO_API_URL;

interface GoReviewResponse {
  id: string;
  product_id: string | null;
  service_id: string | null;
  rating: number;
  comment: string;
  reviewer_name: string;
  reviewer_phone: string | null;
  is_published: boolean;
  source_ip: string | null;
  user_agent: string | null;
  created_at: string;
  updated_at: string;
}

interface GoPublicReviewResponse {
  id: string;
  rating: number;
  comment: string;
  reviewer_name: string;
  created_at: string;
}

interface GoReviewSummaryResponse {
  count: number;
  average: number;
}

interface GoErrorResponse {
  code: string;
  message: string;
  fields?: Record<string, string[]>;
}

function mapGoReview(row: GoReviewResponse): Review {
  return {
    id: row.id,
    productId: row.product_id,
    serviceId: row.service_id,
    rating: row.rating,
    comment: row.comment,
    reviewerName: row.reviewer_name,
    reviewerPhone: row.reviewer_phone,
    isPublished: row.is_published,
    sourceIp: row.source_ip,
    userAgent: row.user_agent,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapGoPublicReview(row: GoPublicReviewResponse): PublicReview {
  return {
    id: row.id,
    rating: row.rating,
    comment: row.comment,
    reviewerName: row.reviewer_name,
    createdAt: row.created_at,
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

// Public — submitted anonymously from the site's review widget. No
// authHeaders(): Go's rate limiter + honeypot field + blocklist auto-filter
// are the actual defense here (see elc-go internal/review/domain/blocklist.go).
export async function createReviewAction(input: CreateReviewInput) {
  if (!GO_API_URL) {
    return { data: null, error: "GO_API_URL is not configured" };
  }
  try {
    const res = await fetch(`${GO_API_URL}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toSnakeCaseBody(input)),
    });
    if (!res.ok) {
      return { data: null, error: await extractErrorMessage(res) };
    }

    const row = (await res.json()) as GoPublicReviewResponse;
    const review = mapGoPublicReview(row);

    return { data: review, error: null };
  } catch (error) {
    console.error("createReviewAction error:", error);
    return { data: null, error: "Không thể gửi đánh giá, vui lòng thử lại." };
  }
}

// Public — published reviews for a product or service detail page.
export async function getPublicReviewsAction(filter: { productId?: string; serviceId?: string }) {
  if (!GO_API_URL) {
    return { data: [] as PublicReview[], error: null };
  }
  try {
    const params = new URLSearchParams();
    if (filter.productId) params.set("product_id", filter.productId);
    if (filter.serviceId) params.set("service_id", filter.serviceId);

    const res = await fetch(`${GO_API_URL}/reviews/public?${params.toString()}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      return { data: [], error: await extractErrorMessage(res) };
    }

    const rows = (await res.json()) as GoPublicReviewResponse[] | null;
    return { data: (rows ?? []).map(mapGoPublicReview), error: null };
  } catch (error) {
    console.error("getPublicReviewsAction error:", error);
    return { data: [], error: "Failed to fetch reviews" };
  }
}

// Public — aggregate rating for a product or service, used for star display
// and schema.org AggregateRating JSON-LD.
export async function getReviewSummaryAction(filter: { productId?: string; serviceId?: string }) {
  if (!GO_API_URL) {
    return { data: { count: 0, average: 0 } as ReviewSummary, error: null };
  }
  try {
    const params = new URLSearchParams();
    if (filter.productId) params.set("product_id", filter.productId);
    if (filter.serviceId) params.set("service_id", filter.serviceId);

    const res = await fetch(`${GO_API_URL}/reviews/summary?${params.toString()}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) {
      return { data: { count: 0, average: 0 }, error: await extractErrorMessage(res) };
    }

    const body = (await res.json()) as GoReviewSummaryResponse;
    return { data: { count: body.count, average: body.average } as ReviewSummary, error: null };
  } catch (error) {
    console.error("getReviewSummaryAction error:", error);
    return { data: { count: 0, average: 0 }, error: "Failed to fetch review summary" };
  }
}

// Admin-only from here down.

export async function getReviewsAction(filter?: ReviewFilter) {
  if (!GO_API_URL) {
    return { data: [] as Review[], error: null };
  }
  try {
    const params = new URLSearchParams();
    if (filter?.productId) params.set("product_id", filter.productId);
    if (filter?.serviceId) params.set("service_id", filter.serviceId);
    if (filter?.isPublished !== undefined) params.set("is_published", String(filter.isPublished));

    const res = await fetch(`${GO_API_URL}/reviews?${params.toString()}`, {
      headers: await authHeaders(),
      cache: "no-store",
    });
    if (!res.ok) {
      return { data: [], error: await extractErrorMessage(res) };
    }

    const rows = (await res.json()) as GoReviewResponse[] | null;
    return { data: (rows ?? []).map(mapGoReview), error: null };
  } catch (error) {
    console.error("getReviewsAction error:", error);
    return { data: [], error: "Failed to fetch reviews" };
  }
}

export async function countReviewsAction(filter?: ReviewFilter) {
  if (!GO_API_URL) {
    return { data: 0, error: null };
  }
  try {
    const params = new URLSearchParams();
    if (filter?.productId) params.set("product_id", filter.productId);
    if (filter?.serviceId) params.set("service_id", filter.serviceId);
    if (filter?.isPublished !== undefined) params.set("is_published", String(filter.isPublished));

    const res = await fetch(`${GO_API_URL}/reviews/count?${params.toString()}`, {
      headers: await authHeaders(),
      cache: "no-store",
    });
    if (!res.ok) {
      return { data: 0, error: await extractErrorMessage(res) };
    }

    const body = (await res.json()) as { count: number };
    return { data: body.count, error: null };
  } catch (error) {
    console.error("countReviewsAction error:", error);
    return { data: 0, error: "Failed to count reviews" };
  }
}

export async function updateReviewPublishedAction(id: string, isPublished: boolean) {
  if (!GO_API_URL) {
    return { data: null, error: "GO_API_URL is not configured" };
  }
  try {
    const res = await fetch(`${GO_API_URL}/reviews/${id}/published`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
      body: JSON.stringify({ is_published: isPublished }),
    });
    if (!res.ok) {
      return { data: null, error: await extractErrorMessage(res) };
    }

    const row = (await res.json()) as GoReviewResponse;
    revalidatePath("/admin/reviews");
    return { data: mapGoReview(row), error: null };
  } catch (error) {
    console.error("updateReviewPublishedAction error:", error);
    return { data: null, error: "Failed to update review" };
  }
}

export async function deleteReviewAction(id: string) {
  if (!GO_API_URL) {
    return { success: false, error: "GO_API_URL is not configured" };
  }
  try {
    const res = await fetch(`${GO_API_URL}/reviews/${id}`, {
      method: "DELETE",
      headers: await authHeaders(),
    });
    if (!res.ok) {
      return { success: false, error: await extractErrorMessage(res) };
    }

    revalidatePath("/admin/reviews");
    return { success: true, error: null };
  } catch (error) {
    console.error("deleteReviewAction error:", error);
    return { success: false, error: "Failed to delete review" };
  }
}
