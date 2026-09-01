import { z } from "zod";

export type Role = "user" | "admin" | "super_admin";

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

export const loginSchema = z.object({
  identifier: z.string().min(1, "Vui lòng nhập tên đăng nhập hoặc email"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.email("Email không hợp lệ"),
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

// Mirrors elc-go's domain.ValidatePassword (internal/auth/domain/types.ts) —
// kept in sync by hand for immediate client-side feedback; Go re-validates
// authoritatively regardless, so drift here is a UX issue, not a security one.
const passwordSchema = z
  .string()
  .min(9, "Mật khẩu phải nhiều hơn 8 ký tự")
  .regex(/[A-Z]/, "Mật khẩu phải có ít nhất 1 chữ hoa")
  .regex(/[a-z]/, "Mật khẩu phải có ít nhất 1 chữ thường")
  .regex(/[0-9]/, "Mật khẩu phải có ít nhất 1 chữ số")
  .regex(/[^a-zA-Z0-9]/, "Mật khẩu phải có ít nhất 1 ký tự đặc biệt");

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: passwordSchema,
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const acceptInviteSchema = z.object({
  token: z.string().min(1),
  username: z
    .string()
    .min(3, "Tên đăng nhập phải từ 3-32 ký tự")
    .max(32, "Tên đăng nhập phải từ 3-32 ký tự")
    .regex(/^[a-zA-Z0-9._]+$/, "Tên đăng nhập chỉ gồm chữ, số, dấu chấm và gạch dưới"),
  password: passwordSchema,
  name: z.string().optional(),
  phone: z.string().optional(),
});
export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>;

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1, "Vui lòng nhập tên hiển thị"),
  email: z.email("Email không hợp lệ"),
  avatarUrl: z.string().optional(),
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Vui lòng nhập mật khẩu hiện tại"),
  newPassword: passwordSchema,
});
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export interface AuthResponse {
  user: AuthUser | null;
  error: string | null;
}
