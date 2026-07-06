export type InquiryStatus = "new" | "contacted" | "converted" | "closed";

export interface Inquiry {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  message: string | null;
  productId: string | null;
  projectId: string | null;
  serviceId: string | null;
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
