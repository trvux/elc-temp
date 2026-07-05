/**
 * Cookie names and options for the Go-backed admin session. Next.js acts as
 * a BFF here: it calls elc-go's /auth/* endpoints server-to-server and
 * stores the resulting tokens as its own httpOnly cookies scoped to this
 * app's own domain — the browser never talks to the Go API directly, so
 * elc-go's own refresh_token cookie (set on its own response) never needs
 * to reach the browser at all.
 */

export const ACCESS_TOKEN_COOKIE = "go_access_token";
export const REFRESH_TOKEN_COOKIE = "go_refresh_token";

// Matches elc-go's application.RefreshTokenTTL (internal/auth/application/const.go).
const REFRESH_TOKEN_MAX_AGE = 30 * 24 * 60 * 60;

function cookieOptions(maxAge: number) {
  const isDev = process.env.NODE_ENV === "development";
  return {
    httpOnly: true,
    secure: !isDev,
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export function accessTokenCookieOptions(expiresInSeconds: number) {
  return cookieOptions(expiresInSeconds);
}

export function refreshTokenCookieOptions() {
  return cookieOptions(REFRESH_TOKEN_MAX_AGE);
}

/**
 * Decodes (does NOT verify the signature of) a JWT's `exp` claim, purely so
 * middleware can decide "is this access token probably still good" without
 * a network round trip on every request. elc-go remains the sole source of
 * truth/enforcement for every real API call — this is only ever used to
 * decide whether a proactive refresh is worth attempting.
 */
export function decodeJwtExpiry(token: string): number | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const claims = JSON.parse(json) as { exp?: number };
    return typeof claims.exp === "number" ? claims.exp : null;
  } catch {
    return null;
  }
}
