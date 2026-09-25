import { cookies } from "next/headers";
import { CONSENT_COOKIE_NAME, ConsentState, parseConsentCookie } from "@/shared/lib/consent";

// Tách riêng khỏi consent.ts vì next/headers chỉ dùng được ở Server
// Component — consent.ts còn bị ConsentBanner (Client Component) import
// cho các type/helper thuần, nên không thể lẫn cookies() vào chung file.
export async function getStoredConsent(): Promise<ConsentState | null> {
  const raw = (await cookies()).get(CONSENT_COOKIE_NAME)?.value;
  return parseConsentCookie(raw);
}
