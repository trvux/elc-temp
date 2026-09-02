import { z } from "zod";

// "member" is the public role — anyone who signs in via Google or magic
// link gets it automatically, with no admin-panel access. "user"/"admin"/
// "super_admin" are admin-panel tiers, only ever granted by an existing
// admin via PATCH /admin/users/{id} (see modules/admin-users) — never
// self-assigned, never automatic past the first ADMIN_EMAILS-allowlisted
// sign-in on elc-go's side.
export type Role = "member" | "user" | "admin" | "super_admin";

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  name: string;
  phone: string;
  avatarUrl: string;
  role: Role;
  lastLoginAt: string | null;
}

export const requestMagicLinkSchema = z.object({
  email: z.email("Email không hợp lệ"),
});
export type RequestMagicLinkInput = z.infer<typeof requestMagicLinkSchema>;

export const verifyMagicLinkCodeSchema = z.object({
  email: z.email(),
  code: z.string().length(6, "Mã gồm 6 chữ số"),
});
export type VerifyMagicLinkCodeInput = z.infer<typeof verifyMagicLinkCodeSchema>;

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1, "Vui lòng nhập tên hiển thị"),
  email: z.email("Email không hợp lệ"),
  avatarUrl: z.string().optional(),
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export interface AuthResponse {
  user: AuthUser | null;
  error: string | null;
}
