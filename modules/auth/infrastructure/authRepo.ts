import { cookies } from "next/headers";

import { authHeaders, toSnakeCaseBody } from "@/shared/lib/go-api";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  accessTokenCookieOptions,
  refreshTokenCookieOptions,
} from "@/shared/lib/auth/cookies";

import {
  AcceptInviteInput,
  AuthRepository,
  AuthUser,
  ChangePasswordInput,
  ForgotPasswordInput,
  LoginInput,
  ResetPasswordInput,
  UpdateProfileInput,
} from "../domain";

const GO_API_URL = process.env.GO_API_URL;

// Without this, a hung/unreachable Go backend (e.g. mid-restart) leaves the
// calling Server Action's promise pending forever — the submit button just
// stays disabled indefinitely with no error, instead of failing visibly.
const GO_API_TIMEOUT_MS = 10_000;

function friendlyErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof DOMException && error.name === "TimeoutError") {
    return "Không thể kết nối máy chủ (quá thời gian chờ), vui lòng thử lại";
  }
  return error instanceof Error ? error.message : fallback;
}

interface GoUserResponse {
  id: string;
  username: string;
  email: string;
  name: string;
  phone: string;
  avatar_url: string;
  role: string;
  last_login_at: string | null;
}

interface GoAccessTokenResponse {
  user: GoUserResponse;
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

interface GoErrorResponse {
  code: string;
  message: string;
  fields?: Record<string, string[]>;
}

function mapGoUser(row: GoUserResponse): AuthUser {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    name: row.name,
    phone: row.phone,
    avatarUrl: row.avatar_url,
    role: row.role as AuthUser["role"],
    lastLoginAt: row.last_login_at,
  };
}

async function extractErrorMessage(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as GoErrorResponse;
    return body.message || `Go API error (${res.status})`;
  } catch {
    return `Go API error (${res.status})`;
  }
}

// Called only from login() below, which only ever runs inside a Server
// Action — cookies().set() is not allowed from a plain Server Component.
async function persistSession(session: GoAccessTokenResponse) {
  const cookieStore = await cookies();
  cookieStore.set(ACCESS_TOKEN_COOKIE, session.access_token, accessTokenCookieOptions(session.expires_in));
  cookieStore.set(REFRESH_TOKEN_COOKIE, session.refresh_token, refreshTokenCookieOptions());
}

// GoAuthRepository is the BFF side of auth: it calls elc-go's /auth/*
// endpoints server-to-server and stores the resulting tokens as this app's
// own httpOnly cookies. The browser only ever talks to Next.js — elc-go's
// own Set-Cookie response header never needs to reach it.
class GoAuthRepository implements AuthRepository {
  async login(input: LoginInput): Promise<{ user: AuthUser | null; error: string | null }> {
    if (!GO_API_URL) {
      return { user: null, error: "GO_API_URL is not configured" };
    }
    try {
      const res = await fetch(`${GO_API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toSnakeCaseBody(input)),
        signal: AbortSignal.timeout(GO_API_TIMEOUT_MS),
      });
      if (!res.ok) {
        return { user: null, error: await extractErrorMessage(res) };
      }

      const session = (await res.json()) as GoAccessTokenResponse;
      await persistSession(session);
      return { user: mapGoUser(session.user), error: null };
    } catch (error) {
      console.error("[GoAuthRepository] login error:", error);
      return { user: null, error: friendlyErrorMessage(error, "Không thể kết nối máy chủ") };
    }
  }

  async logout(): Promise<{ error: string | null }> {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;

    if (GO_API_URL && refreshToken) {
      try {
        await fetch(`${GO_API_URL}/auth/logout`, {
          method: "POST",
          headers: { Cookie: `refresh_token=${refreshToken}` },
          signal: AbortSignal.timeout(GO_API_TIMEOUT_MS),
        });
      } catch (error) {
        // Not fatal — still clear the local cookies below so the user ends
        // up logged out of elc-tem even if elc-go was unreachable.
        console.error("[GoAuthRepository] logout error:", error);
      }
    }

    cookieStore.delete(ACCESS_TOKEN_COOKIE);
    cookieStore.delete(REFRESH_TOKEN_COOKIE);
    return { error: null };
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    if (!GO_API_URL) return null;

    const cookieStore = await cookies();
    const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
    if (!accessToken) return null;

    try {
      const res = await fetch(`${GO_API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
        signal: AbortSignal.timeout(GO_API_TIMEOUT_MS),
      });
      if (!res.ok) return null;

      const row = (await res.json()) as GoUserResponse;
      return mapGoUser(row);
    } catch (error) {
      console.error("[GoAuthRepository] getCurrentUser error:", error);
      return null;
    }
  }

  async forgotPassword(input: ForgotPasswordInput): Promise<{ error: string | null }> {
    if (!GO_API_URL) {
      return { error: "GO_API_URL is not configured" };
    }
    try {
      const res = await fetch(`${GO_API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toSnakeCaseBody(input)),
        signal: AbortSignal.timeout(GO_API_TIMEOUT_MS),
      });
      if (!res.ok) {
        return { error: await extractErrorMessage(res) };
      }
      return { error: null };
    } catch (error) {
      console.error("[GoAuthRepository] forgotPassword error:", error);
      return { error: friendlyErrorMessage(error, "Không thể kết nối máy chủ") };
    }
  }

  async resetPassword(input: ResetPasswordInput): Promise<{ error: string | null }> {
    if (!GO_API_URL) {
      return { error: "GO_API_URL is not configured" };
    }
    try {
      const res = await fetch(`${GO_API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toSnakeCaseBody(input)),
        signal: AbortSignal.timeout(GO_API_TIMEOUT_MS),
      });
      if (!res.ok) {
        return { error: await extractErrorMessage(res) };
      }
      return { error: null };
    } catch (error) {
      console.error("[GoAuthRepository] resetPassword error:", error);
      return { error: friendlyErrorMessage(error, "Không thể kết nối máy chủ") };
    }
  }

  async acceptInvite(input: AcceptInviteInput): Promise<{ user: AuthUser | null; error: string | null }> {
    if (!GO_API_URL) {
      return { user: null, error: "GO_API_URL is not configured" };
    }
    try {
      const res = await fetch(`${GO_API_URL}/auth/accept-invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toSnakeCaseBody(input)),
        signal: AbortSignal.timeout(GO_API_TIMEOUT_MS),
      });
      if (!res.ok) {
        return { user: null, error: await extractErrorMessage(res) };
      }

      const row = (await res.json()) as GoUserResponse;
      return { user: mapGoUser(row), error: null };
    } catch (error) {
      console.error("[GoAuthRepository] acceptInvite error:", error);
      return { user: null, error: friendlyErrorMessage(error, "Không thể kết nối máy chủ") };
    }
  }

  async updateProfile(input: UpdateProfileInput): Promise<{ user: AuthUser | null; error: string | null }> {
    if (!GO_API_URL) {
      return { user: null, error: "GO_API_URL is not configured" };
    }
    try {
      const res = await fetch(`${GO_API_URL}/auth/me`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(await authHeaders()) },
        body: JSON.stringify(toSnakeCaseBody(input)),
        signal: AbortSignal.timeout(GO_API_TIMEOUT_MS),
      });
      if (!res.ok) {
        return { user: null, error: await extractErrorMessage(res) };
      }

      const row = (await res.json()) as GoUserResponse;
      return { user: mapGoUser(row), error: null };
    } catch (error) {
      console.error("[GoAuthRepository] updateProfile error:", error);
      return { user: null, error: friendlyErrorMessage(error, "Không thể kết nối máy chủ") };
    }
  }

  // On success, elc-go revokes every session for this user (including the
  // one making this request) — see internal/auth/application/change_password.go.
  // Clear the local cookies too so this tab doesn't keep sending a now-dead
  // access token, then let the caller redirect to login.
  async changePassword(input: ChangePasswordInput): Promise<{ error: string | null }> {
    if (!GO_API_URL) {
      return { error: "GO_API_URL is not configured" };
    }
    try {
      const res = await fetch(`${GO_API_URL}/auth/me/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await authHeaders()) },
        body: JSON.stringify(toSnakeCaseBody(input)),
        signal: AbortSignal.timeout(GO_API_TIMEOUT_MS),
      });
      if (!res.ok) {
        return { error: await extractErrorMessage(res) };
      }

      const cookieStore = await cookies();
      cookieStore.delete(ACCESS_TOKEN_COOKIE);
      cookieStore.delete(REFRESH_TOKEN_COOKIE);
      return { error: null };
    } catch (error) {
      console.error("[GoAuthRepository] changePassword error:", error);
      return { error: friendlyErrorMessage(error, "Không thể kết nối máy chủ") };
    }
  }
}

export const authRepo = new GoAuthRepository();
