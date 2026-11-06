import type { Inquiry, InterestTouch } from "../domain";

// Shape of one inquiry in elc-go's JSON (snake_case), shared by the admin list
// action and the Excel export route so the two cannot map it differently.
export interface GoInquiryResponse {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  message: string | null;
  product_id: string | null;
  project_id: string | null;
  service_id: string | null;
  lead_type: string;
  sub_type: string | null;
  qualify_data: Record<string, string> | null;
  interest_history: InterestTouch[] | null;
  attachments: string[] | null;
  channel: string;
  gclid: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  ga_client_id: string | null;
  status: string;
  internal_note: string | null;
  conversion_value: number | null;
  ads_conversion_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export function mapGoInquiry(row: GoInquiryResponse): Inquiry {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    message: row.message,
    productId: row.product_id,
    projectId: row.project_id,
    serviceId: row.service_id,
    leadType: row.lead_type as Inquiry["leadType"],
    subType: row.sub_type,
    qualifyData: row.qualify_data ?? {},
    interestHistory: row.interest_history ?? [],
    attachments: row.attachments ?? [],
    channel: row.channel as Inquiry["channel"],
    gclid: row.gclid,
    utmSource: row.utm_source,
    utmMedium: row.utm_medium,
    utmCampaign: row.utm_campaign,
    utmTerm: row.utm_term,
    utmContent: row.utm_content,
    gaClientId: row.ga_client_id,
    status: row.status as Inquiry["status"],
    internalNote: row.internal_note,
    conversionValue: row.conversion_value,
    adsConversionSyncedAt: row.ads_conversion_synced_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
