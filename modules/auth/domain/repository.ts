import {
  AcceptInviteInput,
  AuthUser,
  ForgotPasswordInput,
  LoginInput,
  ResetPasswordInput,
} from "./types";

export interface AuthRepository {
  getCurrentUser(): Promise<AuthUser | null>;

  login(
    input: LoginInput,
  ): Promise<{ user: AuthUser | null; error: string | null }>;

  logout(): Promise<{ error: string | null }>;

  forgotPassword(input: ForgotPasswordInput): Promise<{ error: string | null }>;

  resetPassword(input: ResetPasswordInput): Promise<{ error: string | null }>;

  acceptInvite(
    input: AcceptInviteInput,
  ): Promise<{ user: AuthUser | null; error: string | null }>;
}
