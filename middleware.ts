import { NextRequest, NextResponse } from "next/server";

// Captures gclid/UTM params the moment a visitor arrives from an ad — the
// only place this can happen, since the params only ever exist on the
// landing request's URL. Without this, internal/inquiry (elc-go) has no way
// to tie a lead back to the campaign/keyword that produced it — see
// docs/... (measurement loop-closing plan). "Last Google-Ads-touch" model:
// only overwrite when a NEW request actually carries a fresh ad click/
// campaign — a later direct/organic visit in the same 90-day window must
// not erase attribution already captured.
const ATTRIBUTION_COOKIE = "elc_attribution";
// 90 days — matches the outer bound of Google Ads' own gclid claim window
// for offline conversion import, so the cookie never outlives its purpose.
const ATTRIBUTION_MAX_AGE = 60 * 60 * 24 * 90;

export interface AttributionCookie {
  gclid?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  landingPath: string;
  capturedAt: string;
}

export function middleware(request: NextRequest) {
  const { searchParams, pathname } = request.nextUrl;
  const gclid = searchParams.get("gclid");
  const utmSource = searchParams.get("utm_source");

  // No fresh ad-click/campaign signal on this request — pass through
  // untouched, whatever attribution cookie already exists (if any) stays.
  if (!gclid && !utmSource) {
    return NextResponse.next();
  }

  const attribution: AttributionCookie = {
    gclid: gclid ?? undefined,
    utmSource: utmSource ?? undefined,
    utmMedium: searchParams.get("utm_medium") ?? undefined,
    utmCampaign: searchParams.get("utm_campaign") ?? undefined,
    utmTerm: searchParams.get("utm_term") ?? undefined,
    utmContent: searchParams.get("utm_content") ?? undefined,
    landingPath: pathname,
    capturedAt: new Date().toISOString(),
  };

  const response = NextResponse.next();
  // httpOnly: only ever read server-side (Server Actions/Route Handlers
  // building an inquiry payload) — same posture as modules/event's existing
  // elc_session_id cookie.
  response.cookies.set(ATTRIBUTION_COOKIE, JSON.stringify(attribution), {
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development",
    sameSite: "lax",
    path: "/",
    maxAge: ATTRIBUTION_MAX_AGE,
  });
  return response;
}

// Excludes static assets/Next internals — running the cookie-write logic on
// every JS/image chunk request would be wasted work, and none of those URLs
// ever carry a real ad click's gclid/utm params anyway.
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|gif|ico|css|js|woff2?)$).*)",
  ],
};
