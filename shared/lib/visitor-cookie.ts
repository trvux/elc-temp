import { cookies } from "next/headers";

/**
 * Helpers for the Wishlist/Recently-Viewed Route Handlers (app/api/wishlist,
 * app/api/recently-viewed) proxying to elc-go's anonymous visitor_id cookie
 * mechanism (internal/platform/httpserver.EnsureVisitorID) — no login
 * involved, no customer account, see elc_product_be_features_shipped memory.
 *
 * Bidirectional cookie relay: forward whatever visitor_id the browser
 * already has to Go, then re-mint whatever value Go's Set-Cookie response
 * carries under Next's own cookie control (rather than relaying Go's raw
 * Set-Cookie header) — Go may set attributes (Domain in particular) scoped
 * to its own host, which wouldn't attach correctly to the Next.js origin the
 * browser is actually talking to.
 */

const VISITOR_COOKIE_NAME = "visitor_id";
const VISITOR_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year, matches Go's cookie TTL

export async function forwardVisitorCookieHeader(): Promise<Record<string, string>> {
  const value = (await cookies()).get(VISITOR_COOKIE_NAME)?.value;
  return value ? { Cookie: `${VISITOR_COOKIE_NAME}=${value}` } : {};
}

export async function relayVisitorCookieFromGoResponse(res: Response): Promise<void> {
  const setCookie = res.headers.get("set-cookie");
  if (!setCookie) return;

  const match = setCookie.match(/visitor_id=([^;]+)/);
  if (!match) return;

  (await cookies()).set(VISITOR_COOKIE_NAME, match[1], {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: VISITOR_COOKIE_MAX_AGE,
  });
}
