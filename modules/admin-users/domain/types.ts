import { z } from "zod";

import type { AuthUser, Role } from "@/modules/auth";

// AdminUser is the same shape as the current session's AuthUser — both
// represent a row from elc-go's users table, just fetched from different
// endpoints (/auth/me vs /admin/users).
export type AdminUser = AuthUser & {
  status: "active" | "disabled";
};

export const inviteUserSchema = z.object({
  email: z.email("Email không hợp lệ"),
  role: z.enum(["user", "admin", "super_admin"] satisfies Role[]),
});
export type InviteUserInput = z.infer<typeof inviteUserSchema>;

export const ROLE_LABELS: Record<Role, string> = {
  user: "Nhân viên",
  admin: "Quản trị viên",
  super_admin: "Quản trị cấp cao",
};
