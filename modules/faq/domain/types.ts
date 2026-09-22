// Mirrors elc-go internal/faq/domain's OwnerType — the fixed, closed set
// of page/entity kinds a FAQ can attach to. Keep in sync with that file's
// enum and the DB's chk_faq_owner_type constraint.
export type FAQOwnerType =
  | "system_page"
  | "product"
  | "project"
  | "service"
  | "news"
  | "branch"
  | "page";

export interface FAQ {
  id: string;
  ownerType: FAQOwnerType;
  ownerId: string;
  question: string;
  answer: string;
  orderIndex: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFAQInput {
  ownerType: FAQOwnerType;
  ownerId: string;
  question: string;
  answer: string;
  orderIndex?: number;
  isPublished?: boolean;
}

export interface UpdateFAQInput {
  id: string;
  question?: string;
  answer?: string;
  orderIndex?: number;
  isPublished?: boolean;
}
