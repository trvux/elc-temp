import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { toSnakeCaseBody } from "@/shared/lib/go-api";
import { readAttribution, readGAClientID } from "@/shared/lib/attribution";
import { reverseGeocode } from "@/shared/lib/geocode";

const GO_API_URL = process.env.GO_API_URL;
// Mirrors modules/event/presentation/actions.ts's SESSION_COOKIE — same
// first-party anonymous session id, read here (not minted here) since a
// contact-click beacon always fires after at least one page view already
// created it.
const SESSION_COOKIE = "elc_session_id";

// A plain Route Handler, not a Server Action — navigator.sendBeacon (see
// modules/inquiry/presentation/track-contact-click.ts) can only POST to an
// ordinary URL, not call a "use server" action directly. Thin BFF proxy to
// elc-go's POST /inquiries/clicks: the client sends only what it knows
// (channel, entity, page path); this handler fills in everything only the
// server can see — the httpOnly elc_attribution/elc_session_id cookies —
// same split as createInquiryAction (modules/inquiry/presentation/actions.ts)
// uses for the on-site form.
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!GO_API_URL) {
    return Response.json({ ok: false }, { status: 200 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false }, { status: 200 });
  }

  // lat/lng (see shared/lib/geolocation.ts) never reach elc-go directly —
  // reverse-geocoded here into a plain "khu vực" string instead, same
  // reasoning as createInquiryAction: this proxy is the only place with
  // both the raw coords and GEOCODING_API_KEY.
  const { lat, lng, ...clickFields } = body;
  const hasCoords = typeof lat === "number" && typeof lng === "number";

  const [attribution, gaClientId, cookieStore, location] = await Promise.all([
    readAttribution(),
    readGAClientID(),
    cookies(),
    hasCoords ? reverseGeocode(lat as number, lng as number) : Promise.resolve(null),
  ]);
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

  const payload = toSnakeCaseBody({
    ...clickFields,
    sessionId,
    gclid: attribution?.gclid,
    utmSource: attribution?.utmSource,
    utmMedium: attribution?.utmMedium,
    utmCampaign: attribution?.utmCampaign,
    utmTerm: attribution?.utmTerm,
    utmContent: attribution?.utmContent,
    gaClientId,
    location,
  });

  try {
    await fetch(`${GO_API_URL}/inquiries/clicks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    // sendBeacon never reads this response either way — logged for our own
    // visibility only, never surfaced to the visitor.
    console.error("contact-click proxy error:", error);
  }

  // sendBeacon ignores the response body/status entirely — still a clean
  // 200 for anyone inspecting this in devtools.
  return Response.json({ ok: true });
}
