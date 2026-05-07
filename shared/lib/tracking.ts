import * as gtag from "./gtag";
import { createClient } from "./supabase/client";

interface TrackEventProps {
  action: string;
  category?: string;
  label?: string;
  value?: number;
  metadata?: Record<string, any>;
  isConversion?: boolean;
}

export const trackEvent = async ({
  action,
  category = "engagement",
  label,
  value,
  metadata = {},
  isConversion = false,
}: TrackEventProps) => {
  // Tự động bắt các tham số UTM từ URL
  const getUtms = () => {
    if (typeof window === "undefined") return {};
    const params = new URLSearchParams(window.location.search);
    return {
      utm_source: params.get("utm_source"),
      utm_medium: params.get("utm_medium"),
      utm_campaign: params.get("utm_campaign"),
      utm_content: params.get("utm_content"),
      utm_term: params.get("utm_term"),
      gclid: params.get("gclid"), // Mã click của Google Ads
    };
  };

  const utms = getUtms();
  const enrichedMetadata = { ...metadata, ...utms };

  // 1. Gửi đến Google Analytics
  gtag.event({
    action,
    category,
    label,
    value,
    ...enrichedMetadata,
  });

  // 2. Nếu là chuyển đổi quan trọng, gửi đến Google Ads
  if (isConversion) {
    const conversionId = process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID;
    if (conversionId) {
      gtag.trackGoogleAdsConversion(conversionId, value);
    }
  }

  // 3. Lưu vào Database Supabase để làm báo cáo Admin
  try {
    const supabase = createClient();
    await (supabase as any).from("tracking_events").insert({
      event_name: action,
      event_category: category,
      event_label: label,
      page_path: typeof window !== "undefined" ? window.location.pathname : "",
      metadata: enrichedMetadata,
    });
  } catch (error) {
    console.error("Failed to save tracking event to DB:", error);
  }
};

export const trackPageView = (url: string) => {
  gtag.pageview(url);
  // Có thể lưu page_view vào DB nếu muốn báo cáo chi tiết luồng khách đi
  const supabase = createClient();
  (supabase as any).from("tracking_events").insert({
    event_name: "page_view",
    event_category: "navigation",
    page_path: url,
  });
};
