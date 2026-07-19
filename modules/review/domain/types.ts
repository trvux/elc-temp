// Generic review/rating feature — a public 1-5 star rating + comment
// attachable to a product, project, service, or news article (exactly one
// per review, enforced server-side). See elc-go's internal/review/domain.
export type ReviewEntityType = "product" | "project" | "service" | "news";

// No reviewerPhone here — the public GET endpoint never returns it (PII,
// see elc-go's reviewResponse doc comment), so the read shape doesn't carry
// a field that would always be empty.
export interface Review {
  id: string;
  rating: number;
  comment: string;
  reviewerName: string;
  createdAt: string;
}

export interface ReviewAggregate {
  average: number;
  count: number;
}

export interface CreateReviewInput {
  entityType: ReviewEntityType;
  entityId: string;
  rating: number;
  reviewerName: string;
  reviewerPhone: string;
  comment: string;
  // Honeypot: hidden from real visitors, must stay empty.
  website?: string;
}

// AdminReview is the staff-only shape — unlike Review it carries
// reviewerPhone and which product (if any) the review is about. Backed by
// elc-go's GET /admin/reviews, gated by RequireAuth+RequirePermission.
export interface AdminReview {
  id: string;
  rating: number;
  comment: string;
  reviewerName: string;
  reviewerPhone: string | null;
  productId: string | null;
  productName: string | null;
  productSlug: string | null;
  isPublished: boolean;
  createdAt: string;
}

export interface AdminReviewFilter {
  limit?: number;
  offset?: number;
}
