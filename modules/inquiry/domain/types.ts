export type InquiryStatus = "new" | "contacted" | "converted" | "closed";

// Which of the lead-capture form's 3 branches (or none) the visitor went
// through — recorded even if they skipped every catalog picker. See
// elc-go internal/inquiry/domain's LeadType.
export type LeadType = "product" | "service" | "project" | "general";

export interface Inquiry {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  message: string | null;
  productId: string | null;
  projectId: string | null;
  serviceId: string | null;
  leadType: LeadType;
  subType: string | null;
  qualifyData: Record<string, string>;
  attachments: string[];
  status: InquiryStatus;
  internalNote: string | null;
  createdAt: string;
  updatedAt: string;
}

// At most one of productId/projectId/serviceId — enforced server-side, see
// elc-go internal/inquiry/domain's chk_inquiry_single_entity constraint.
export interface CreateInquiryInput {
  name: string;
  phone: string;
  email?: string;
  message?: string;
  productId?: string;
  projectId?: string;
  serviceId?: string;
  leadType?: LeadType;
  subType?: string;
  // Every ChoiceStep/picker answer as a flat {stepId: value} map — opaque
  // to the backend (stored as JSONB), only ever read back for admin display.
  qualifyData?: Record<string, string>;
  // Photo URLs from uploadInquiryAttachmentAction, max 6.
  attachments?: string[];
  // Honeypot: a hidden field real visitors never see or fill. Left here so
  // the request shape matches elc-go's createInquiryRequest exactly.
  website?: string;
}

export interface UpdateInquiryStatusInput {
  id: string;
  status?: InquiryStatus;
  internalNote?: string;
}

export interface InquiryFilter {
  status?: string;
  search?: string;
}
