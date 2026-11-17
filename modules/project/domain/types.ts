import type { ImageAsset, ImageRole } from "@/shared/lib/image-asset";
import type { ServiceLine } from "@/modules/service/domain/line";
export type { ImageAsset, ImageRole };
import type { TitleAlign } from "@/shared/lib/title-align";
export type { TitleAlign };

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ClientKind = "person" | "business";
export type CompletedPrecision = "day" | "month" | "year" | "unknown";

// Typed per-project facts (elc-go internal/project/domain/facts.go). Every
// number is null when unknown: null is never rendered and never emitted to
// JSON-LD, so nothing is ever invented. Equipment condition (new/used) is NOT
// here — it is derived from `categories[].condition`, see projectCondition().
export interface ProjectFacts {
  /** CURRENT province name from PROVINCES; "" = not filled. */
  province: string;
  /** Current commune/ward (optional). */
  ward: string;
  completedPrecision: CompletedPrecision;
  /** null is treated as "person" (the safe default). */
  clientKind: ClientKind | null;
  /** Staff-only: when the client agreed to show their name. */
  clientConsentAt: string | null;
  /** Staff-only: how/where consent was given. */
  clientConsentNote: string;
  indoorUnits: number | null;
  capacityHp: number | null;
  airflowM3h: number | null;
  areaM2: number | null;
  floors: number | null;
  durationDays: number | null;
  warrantyMonths: number | null;
  brands: string[];
}

export const EMPTY_FACTS: ProjectFacts = {
  province: "",
  ward: "",
  completedPrecision: "unknown",
  clientKind: null,
  clientConsentAt: null,
  clientConsentNote: "",
  indoorUnits: null,
  capacityHp: null,
  airflowM3h: null,
  areaM2: null,
  floors: null,
  durationDays: null,
  warrantyMonths: null,
  brands: [],
};

/** "new" / "used" when every attached category has that condition, else "mixed"; null if none. */
export function projectCondition(
  categories: { condition: "new" | "used" }[] | undefined,
): "new" | "used" | "mixed" | null {
  if (!categories || categories.length === 0) return null;
  const conditions = new Set(categories.map((c) => c.condition));
  if (conditions.size > 1) return "mixed";
  return conditions.has("used") ? "used" : "new";
}

interface Project {
  id: string;
  title: string;
  titleAlign: TitleAlign;
  slug: string;
  description: Json;
  images: ImageAsset[];
  isFeatured: boolean;
  isPublished: boolean;
  metaTitle?: string | null;
  metaDescription?: string | null;
  orderIndex: number;
  projectTypeId: string | null;
  clientName?: string;
  location?: string;
  completedAt?: string | null;
  testimonialQuote?: string;
  testimonialAuthor?: string;
  facts: ProjectFacts;
  /** Staff-only: what is still missing before this could be published. */
  publishGaps?: string[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface ProjectWithCategory extends Project {
  category?: { 
    id: string; 
    name: string; 
    slug: string;
    parent?: { id: string; name: string; slug: string } | null;
  } | null;
  projectType?: {
    id: string;
    name: string;
    slug?: string;
  } | null;
  services?: {
    id: string;
    title: string;
    slug: string;
    line?: ServiceLine;
  }[];
  categories?: {
    id: string;
    name: string;
    slug: string;
    groupId: string | null;
    group?: { id: string; name: string } | null;
    condition: "new" | "used";
  }[];
}

export interface CreateProjectInput {
  title: string;
  titleAlign?: TitleAlign;
  slug: string;
  description?: Json;
  images?: ImageAsset[];
  isFeatured?: boolean;
  isPublished?: boolean;
  metaTitle?: string | null;
  metaDescription?: string | null;
  orderIndex?: number;
  projectTypeId?: string | null;
  serviceIds?: string[];
  categories?: { id: string; condition: "new" | "used" }[];
  clientName?: string;
  location?: string;
  completedAt?: string | null;
  testimonialQuote?: string;
  testimonialAuthor?: string;
  facts?: ProjectFacts;
}

export interface UpdateProjectInput extends Partial<CreateProjectInput> {
  id: string;
}

export interface ProjectFilter {
  projectTypeId?: string;
  categorySlug?: string;
  categorySlugs?: string[];
  serviceSlug?: string;
  serviceSlugs?: string[];
  isPublished?: boolean;
  isFeatured?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
  includeDeleted?: boolean;
  orderBy?: "orderIndex" | "createdAt" | "title";
  orderDirection?: "asc" | "desc";
}
