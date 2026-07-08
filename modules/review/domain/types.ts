export interface Review {
  id: string;
  productId: string | null;
  serviceId: string | null;
  rating: number;
  comment: string;
  reviewerName: string;
  reviewerPhone: string | null;
  isPublished: boolean;
  sourceIp: string | null;
  userAgent: string | null;
  createdAt: string;
  updatedAt: string;
}

// The public product/service detail page only ever needs this subset — see
// elc-go internal/review/presentation/dto.go's publicReviewResponse, which
// this shape mirrors (no phone/IP/user-agent, that's moderation-only data).
export interface PublicReview {
  id: string;
  rating: number;
  comment: string;
  reviewerName: string;
  createdAt: string;
}

export interface ReviewSummary {
  count: number;
  average: number;
}

// Exactly one of productId/serviceId — enforced server-side, see elc-go
// internal/review/domain's chk_review_single_entity constraint.
export interface CreateReviewInput {
  productId?: string;
  serviceId?: string;
  rating: number;
  comment: string;
  reviewerName: string;
  reviewerPhone?: string;
  // Honeypot: a hidden field real visitors never see or fill. Left here so
  // the request shape matches elc-go's createReviewRequest exactly.
  website?: string;
}

export interface ReviewFilter {
  productId?: string;
  serviceId?: string;
  isPublished?: boolean;
}
