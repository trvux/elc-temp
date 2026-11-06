import type { NextRequest, NextResponse } from "next/server";

import { classifyReferrer } from "./referrer-source";

// Captures gclid/UTM params the moment a visitor arrives from an ad — the
// only place this can happen, since the params only ever exist on the
// landing request's URL. Without this, internal/inquiry (elc-go) has no way
// to tie a lead back to the campaign/keyword that produced it. Called from
// proxy.ts (Next.js 16 renamed "middleware" to "proxy" — see
// shared/proxy.ts's own redirect/session logic, left untouched) rather than
// being its own proxy export, so it decorates whatever response the
// existing redirect/session logic already produced instead of competing
// with it for the single proxy.ts entry point. "Last Google-Ads-touch"
// model: only overwrite when a NEW request actually carries a fresh ad
// click/campaign — a later direct/organic visit in the same 90-day window
// must not erase attribution already captured.
const ATTRIBUTION_COOKIE = "elc_attribution";
// 90 days — matches the outer bound of Google Ads' own gclid claim window
// for offline conversion import, so the cookie never outlives its purpose.
const ATTRIBUTION_MAX_AGE = 60 * 60 * 24 * 90;

// Visits with no ad signal get a source inferred from the Referer ("google / organic"),
// kept for 30 days: shorter than a paid click, which has a real claim window behind it.
const INFERRED_MAX_AGE = 60 * 60 * 24 * 30;

export interface AttributionCookie {
  gclid?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  landingPath: string;
  capturedAt: string;
  /** True when utmSource/utmMedium were inferred from the Referer rather than read from the URL. */
  inferred?: boolean;
}

export function captureAttribution(request: NextRequest, response: NextResponse): void {
  const { searchParams, pathname } = request.nextUrl;
  const gclid = searchParams.get("gclid");
  const utmSource = searchParams.get("utm_source");

  // No fresh ad-click/campaign signal on this request — leave whatever
  // attribution cookie already exists (if any) untouched.
  if (!gclid && !utmSource) {
    captureInferredSource(request, response);
    return;
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
}

// A real page load: not a Next.js prefetch or client-side RSC fetch (their Referer is our
// own site anyway), not an image or an API call.
function isPageNavigation(request: NextRequest): boolean {
  if (request.method !== "GET") return false;
  const h = request.headers;
  if (h.get("rsc") || h.get("next-router-prefetch") || h.get("purpose") === "prefetch") return false;
  const dest = h.get("sec-fetch-dest");
  if (dest) return dest === "document";
  return (h.get("accept") ?? "").includes("text/html");
}

/**
 * For a visitor who arrives with no gclid and no utm_* and has no attribution cookie yet,
 * records where they came from when the browser says so (organic search, a social post, a
 * link on another site). It never replaces an existing cookie, so an ad click stays the
 * winner, and it writes nothing for a direct visit: a blank source in the admin means
 * "typed the address / no referrer".
 */
function captureInferredSource(request: NextRequest, response: NextResponse): void {
  if (request.cookies.get(ATTRIBUTION_COOKIE)) return;
  if (!isPageNavigation(request)) return;

  const siteHost = request.nextUrl.hostname;
  const inferred = classifyReferrer(request.headers.get("referer"), siteHost);
  if (!inferred) return;

  const attribution: AttributionCookie = {
    utmSource: inferred.source,
    utmMedium: inferred.medium,
    landingPath: request.nextUrl.pathname,
    capturedAt: new Date().toISOString(),
    inferred: true,
  };
  response.cookies.set(ATTRIBUTION_COOKIE, JSON.stringify(attribution), {
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development",
    sameSite: "lax",
    path: "/",
    maxAge: INFERRED_MAX_AGE,
  });
}
