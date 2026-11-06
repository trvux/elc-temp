// @vitest-environment node
import { NextRequest, NextResponse } from "next/server";
import { describe, expect, it } from "vitest";

import { captureAttribution, type AttributionCookie } from "../attribution-capture";

function visit(url: string, headers: Record<string, string> = {}, cookie?: string) {
  const request = new NextRequest(url, { headers: { "sec-fetch-dest": "document", ...headers, ...(cookie ? { cookie } : {}) } });
  const response = NextResponse.next();
  captureAttribution(request, response);
  const raw = response.cookies.get("elc_attribution");
  return { raw, data: raw ? (JSON.parse(raw.value) as AttributionCookie) : null };
}

const SITE = "https://dienmayelc.com.vn";

describe("captureAttribution: ad signals (unchanged)", () => {
  it("stores gclid and utm from the URL for 90 days", () => {
    const { raw, data } = visit(`${SITE}/?gclid=ABC&utm_source=google&utm_medium=cpc&utm_campaign=x`, { referer: "https://www.google.com/" });
    expect(data).toMatchObject({ gclid: "ABC", utmSource: "google", utmMedium: "cpc", utmCampaign: "x" });
    expect(data?.inferred).toBeUndefined();
    expect(raw?.maxAge).toBe(60 * 60 * 24 * 90);
  });

  it("replaces an existing cookie when a new ad click arrives", () => {
    const old = encodeURIComponent(JSON.stringify({ utmSource: "google", utmMedium: "organic", landingPath: "/", capturedAt: "x", inferred: true }));
    const { data } = visit(`${SITE}/?gclid=NEW`, {}, `elc_attribution=${old}`);
    expect(data?.gclid).toBe("NEW");
  });
});

describe("captureAttribution: source inferred from the Referer", () => {
  it("records organic search with no ad signal", () => {
    const { raw, data } = visit(`${SITE}/san-pham/may-lanh`, { referer: "https://www.google.com/" });
    expect(data).toMatchObject({ utmSource: "google", utmMedium: "organic", landingPath: "/san-pham/may-lanh", inferred: true });
    expect(data?.gclid).toBeUndefined();
    expect(raw?.maxAge).toBe(60 * 60 * 24 * 30);
  });

  it("records a social referral", () => {
    expect(visit(`${SITE}/`, { referer: "https://l.facebook.com/l.php?u=1" }).data).toMatchObject({ utmSource: "facebook", utmMedium: "social" });
  });

  it("writes nothing for a direct visit", () => {
    expect(visit(`${SITE}/`).raw).toBeUndefined();
  });

  it("never replaces an existing cookie", () => {
    const paid = encodeURIComponent(JSON.stringify({ gclid: "AD", landingPath: "/", capturedAt: "x" }));
    expect(visit(`${SITE}/`, { referer: "https://www.google.com/" }, `elc_attribution=${paid}`).raw).toBeUndefined();
  });

  it("ignores moving around our own site, prefetches and non-page requests", () => {
    expect(visit(`${SITE}/dich-vu`, { referer: `${SITE}/` }).raw).toBeUndefined();
    expect(visit(`${SITE}/dich-vu`, { referer: "https://www.google.com/", rsc: "1" }).raw).toBeUndefined();
    expect(visit(`${SITE}/dich-vu`, { referer: "https://www.google.com/", "next-router-prefetch": "1" }).raw).toBeUndefined();
    expect(visit(`${SITE}/api/contact-click`, { referer: "https://www.google.com/", "sec-fetch-dest": "empty" }).raw).toBeUndefined();
  });

  it("falls back to the Accept header when the browser sends no Sec-Fetch-Dest", () => {
    const request = new NextRequest(`${SITE}/`, { headers: { referer: "https://www.bing.com/", accept: "text/html,application/xhtml+xml" } });
    const response = NextResponse.next();
    captureAttribution(request, response);
    expect(response.cookies.get("elc_attribution")).toBeDefined();
  });
});
