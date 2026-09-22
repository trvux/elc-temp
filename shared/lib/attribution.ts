import { cookies } from "next/headers";
import type { AttributionCookie } from "@/shared/lib/attribution-capture";

const ATTRIBUTION_COOKIE = "elc_attribution";

// Reads the httpOnly cookie middleware.ts writes on any request carrying a
// fresh gclid/utm_source — only ever callable server-side (Server
// Actions/Route Handlers), same as modules/event's elc_session_id cookie.
// Returns null when the visitor never arrived via an ad/campaign link.
export async function readAttribution(): Promise<AttributionCookie | null> {
  const raw = (await cookies()).get(ATTRIBUTION_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AttributionCookie;
  } catch {
    return null;
  }
}

// GA4's own `_ga` cookie (set by the GTM container's GA4 Configuration tag,
// same as gtag.js would) — NOT httpOnly, Google sets it readable so both
// client and server code can see it. Format: "GA1.<depth>.<random>.<epoch>"
// — the client_id Measurement Protocol expects is the last two dot-segments
// joined, not the cookie value verbatim. Needed later to tie a
// staff-marked "converted" outcome (fired server-side, days after the
// visitor's own session ended) back to their original GA4 session/
// attribution — see internal/inquiry's ga_client_id column.
export async function readGAClientID(): Promise<string | null> {
  const raw = (await cookies()).get("_ga")?.value;
  if (!raw) return null;
  const parts = raw.split(".");
  if (parts.length < 4) return null;
  return parts.slice(-2).join(".");
}
