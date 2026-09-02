import { AuthUser, RequestMagicLinkInput, UpdateProfileInput } from "./types";

export interface AuthRepository {
  getCurrentUser(): Promise<AuthUser | null>;

  logout(): Promise<{ error: string | null }>;

  googleLogin(code: string): Promise<{ user: AuthUser | null; error: string | null }>;

  requestMagicLink(input: RequestMagicLinkInput): Promise<{ error: string | null }>;

  verifyMagicLinkCode(
    email: string,
    code: string,
  ): Promise<{ user: AuthUser | null; error: string | null }>;

  verifyMagicLinkToken(
    token: string,
  ): Promise<{ user: AuthUser | null; error: string | null }>;

  updateProfile(
    input: UpdateProfileInput,
  ): Promise<{ user: AuthUser | null; error: string | null }>;
}
