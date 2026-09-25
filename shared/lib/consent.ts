/**
 * Google Consent Mode v2 for a GTM-only site (no gtag.js library ever
 * loaded — see shared/lib/gtag.ts). Google documents this exact pattern
 * for sites that only use Tag Manager: define a tiny local `gtag` stub
 * that pushes consent commands onto the same dataLayer GTM already reads,
 * so gtm.js's built-in Consent Mode support (no extra GTM tag config
 * needed for Google's own tags — GA4 Configuration, Google Ads Conversion
 * Tracking, Conversion Linker) blocks/allows them before any tag fires.
 * https://developers.google.com/tag-platform/security/guides/consent#tag-manager-and-gtag.js
 */

export const CONSENT_COOKIE_NAME = "elc_consent";
export const CONSENT_COOKIE_MAX_AGE = 60 * 60 * 24 * 180; // 6 tháng

export type ConsentChoice = "granted" | "denied";

export interface ConsentState {
  analytics: ConsentChoice;
  ads: ConsentChoice;
}

// Mặc định TỪ CHỐI cho tới khi khách tự chọn — bắt buộc theo Nghị định
// 13/2023/NĐ-CP (phải có sự đồng ý TRƯỚC khi thu thập dữ liệu cá nhân),
// không phải opt-out sau.
export const DEFAULT_CONSENT: ConsentState = { analytics: "denied", ads: "denied" };

export function parseConsentCookie(raw: string | undefined): ConsentState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw));
    if (
      (parsed.analytics === "granted" || parsed.analytics === "denied") &&
      (parsed.ads === "granted" || parsed.ads === "denied")
    ) {
      return { analytics: parsed.analytics, ads: parsed.ads };
    }
  } catch {
    // cookie hỏng/cũ định dạng khác — coi như chưa chọn, hỏi lại
  }
  return null;
}

export function serializeConsentCookie(state: ConsentState): string {
  return encodeURIComponent(JSON.stringify(state));
}

// 2 category đơn giản (Phân tích / Quảng cáo) ánh xạ ra 4 tín hiệu Consent
// Mode v2 mà tag của Google đọc. ad_user_data/ad_personalization (2 tín
// hiệu mới của v2) gộp chung vào "ads" vì ELC không chạy remarketing/
// personalized-ads tách riêng khỏi conversion tracking.
export function toGtagConsentPayload(state: ConsentState) {
  return {
    analytics_storage: state.analytics,
    ad_storage: state.ads,
    ad_user_data: state.ads,
    ad_personalization: state.ads,
    functionality_storage: "granted",
    security_storage: "granted",
  };
}
