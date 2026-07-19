"use server";

import { authHeaders } from "@/shared/lib/go-api";
import { AdminReview, AdminReviewFilter, CreateReviewInput, Review, ReviewAggregate, ReviewEntityType } from "../domain";

const GO_API_URL = process.env.GO_API_URL;

interface GoReviewResponse {
  id: string;
  rating: number;
  comment: string;
  reviewer_name: string;
  created_at: string;
}

interface GoAdminReviewResponse {
  id: string;
  rating: number;
  comment: string;
  reviewer_name: string;
  reviewer_phone: string | null;
  product_id: string | null;
  product_name: string | null;
  product_slug: string | null;
  is_published: boolean;
  created_at: string;
}

interface GoReviewListResponse {
  data: GoReviewResponse[] | null;
  aggregate: { average: number; count: number };
}

interface GoErrorResponse {
  code: string;
  message: string;
  fields?: Record<string, string[]>;
}

function mapGoReview(row: GoReviewResponse): Review {
  return {
    id: row.id,
    rating: row.rating,
    comment: row.comment,
    reviewerName: row.reviewer_name,
    createdAt: row.created_at,
  };
}

function mapGoAdminReview(row: GoAdminReviewResponse): AdminReview {
  return {
    id: row.id,
    rating: row.rating,
    comment: row.comment,
    reviewerName: row.reviewer_name,
    reviewerPhone: row.reviewer_phone,
    productId: row.product_id,
    productName: row.product_name,
    productSlug: row.product_slug,
    isPublished: row.is_published,
    createdAt: row.created_at,
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

const emptyAggregate: ReviewAggregate = { average: 0, count: 0 };

// Public, published-only read — GET /reviews/{entityType}/{entityId} never
// requires auth, see internal/review/presentation/routes.go.
export async function getReviewsAction(entityType: ReviewEntityType, entityId: string) {
  if (!GO_API_URL) {
    return { data: [] as Review[], aggregate: emptyAggregate, error: null };
  }
  try {
    const res = await fetch(`${GO_API_URL}/reviews/${entityType}/${encodeURIComponent(entityId)}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      return { data: [], aggregate: emptyAggregate, error: await extractErrorMessage(res, "Không thể tải đánh giá") };
    }

    const body = (await res.json()) as GoReviewListResponse;
    return {
      data: (body.data ?? []).map(mapGoReview),
      aggregate: body.aggregate ?? emptyAggregate,
      error: null,
    };
  } catch (error) {
    console.error("getReviewsAction error:", error);
    return { data: [], aggregate: emptyAggregate, error: "Không thể tải đánh giá" };
  }
}

// Public write — no bearer token, guest submission (rate-limited + honeypot
// server-side), matches internal/review's Create handler.
export async function createReviewAction(input: CreateReviewInput) {
  if (!GO_API_URL) {
    return { data: null, error: "GO_API_URL is not configured" };
  }
  try {
    const res = await fetch(`${GO_API_URL}/reviews/${input.entityType}/${encodeURIComponent(input.entityId)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rating: input.rating,
        reviewer_name: input.reviewerName,
        reviewer_phone: input.reviewerPhone,
        comment: input.comment,
        website: input.website || "",
      }),
    });
    if (!res.ok) {
      return { data: null, error: await extractErrorMessage(res, "Không thể gửi đánh giá") };
    }

    const row = (await res.json()) as GoReviewResponse;
    return { data: mapGoReview(row), error: null };
  } catch (error) {
    console.error("createReviewAction error:", error);
    return { data: null, error: "Không thể gửi đánh giá" };
  }
}

// Admin-only from here down.

export async function getAdminReviewsAction(filter?: AdminReviewFilter) {
  if (!GO_API_URL) {
    return { data: [] as AdminReview[], error: null };
  }
  try {
    const params = new URLSearchParams();
    if (filter?.limit) params.set("limit", String(filter.limit));
    if (filter?.offset) params.set("offset", String(filter.offset));

    const res = await fetch(`${GO_API_URL}/admin/reviews?${params.toString()}`, {
      headers: await authHeaders(),
      cache: "no-store",
    });
    if (!res.ok) {
      return { data: [], error: await extractErrorMessage(res, "Không thể tải danh sách đánh giá") };
    }

    const rows = (await res.json()) as GoAdminReviewResponse[] | null;
    return { data: (rows ?? []).map(mapGoAdminReview), error: null };
  } catch (error) {
    console.error("getAdminReviewsAction error:", error);
    return { data: [], error: "Không thể tải danh sách đánh giá" };
  }
}

export async function countAdminReviewsAction() {
  if (!GO_API_URL) {
    return { data: 0, error: null };
  }
  try {
    const res = await fetch(`${GO_API_URL}/admin/reviews/count`, {
      headers: await authHeaders(),
      cache: "no-store",
    });
    if (!res.ok) {
      return { data: 0, error: await extractErrorMessage(res, "Không thể đếm đánh giá") };
    }

    const body = (await res.json()) as { count: number };
    return { data: body.count, error: null };
  } catch (error) {
    console.error("countAdminReviewsAction error:", error);
    return { data: 0, error: "Không thể đếm đánh giá" };
  }
}
