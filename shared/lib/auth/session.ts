import { NextResponse, type NextRequest } from "next/server";

import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  accessTokenCookieOptions,
  decodeJwtExpiry,
  refreshTokenCookieOptions,
} from "./cookies";

const GO_API_URL = process.env.GO_API_URL;

interface GoRefreshResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Sign-in lives entirely outside /admin now (/login, /login/verify,
  // /magic-link — see modules/auth), so there's no "public admin path"
  // allowlist to maintain here anymore: this gate only ever needs to guard
  // /admin/* itself.
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next({ request });
  }

  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const expiry = accessToken ? decodeJwtExpiry(accessToken) : null;
  // 30s leeway so a request in flight doesn't get a token that expires
  // before it reaches elc-go.
  const isAccessTokenFresh =
    expiry !== null && expiry * 1000 > Date.now() + 30_000;

  if (isAccessTokenFresh) {
    return NextResponse.next({ request });
  }

  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  if (GO_API_URL && refreshToken) {
    try {
      const res = await fetch(`${GO_API_URL}/auth/refresh`, {
        method: "POST",
        headers: { Cookie: `refresh_token=${refreshToken}` },
      });

      if (res.ok) {
        const session = (await res.json()) as GoRefreshResponse;

        // Mutate the request's own cookies so downstream Server Components
        // in *this* render see the fresh token immediately, then rebuild
        // the response from that mutated request before also setting the
        // Set-Cookie headers the browser stores for future requests — the
        // same two-step pattern the previous Supabase-based session refresh
        // used here (shared/lib/supabase/session.ts, now unused).
        request.cookies.set(ACCESS_TOKEN_COOKIE, session.access_token);
        request.cookies.set(REFRESH_TOKEN_COOKIE, session.refresh_token);

        const response = NextResponse.next({ request });
        response.cookies.set(
          ACCESS_TOKEN_COOKIE,
          session.access_token,
          accessTokenCookieOptions(session.expires_in),
        );
        response.cookies.set(
          REFRESH_TOKEN_COOKIE,
          session.refresh_token,
          refreshTokenCookieOptions(),
        );
        return response;
      }
    } catch (error) {
      console.error("[updateSession] refresh failed:", error);
    }
  }

  const url = request.nextUrl.clone();
  url.pathname = "/login";

  const accept = request.headers.get("accept") || "";
  const isRsc =
    accept.includes("text/x-component") ||
    request.nextUrl.searchParams.has("_rsc") ||
    request.headers.has("rsc");

  if (isRsc) {
    url.searchParams.set("rsc", "1");
  }

  const response = NextResponse.redirect(url);
  response.cookies.delete(ACCESS_TOKEN_COOKIE);
  response.cookies.delete(REFRESH_TOKEN_COOKIE);
  return response;
}
