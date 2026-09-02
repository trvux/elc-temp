import type { AuthUser, Role } from "@/modules/auth";

// AdminUser is the same shape as the current session's AuthUser — both
// represent a row from elc-go's users table, just fetched from different
// endpoints (/auth/me vs /admin/users).
export type AdminUser = AuthUser & {
  status: "active" | "disabled";
};

// There is no more "invite" flow — anyone who signs in via Google/magic
// link (see modules/auth) already has a row here as role=member. Granting
// admin-panel access is just promoting that existing row's role, which is
// exactly what this screen's role Select (see UsersColumns) does via
// updateUserRoleAction.
export const ROLE_LABELS: Record<Role, string> = {
  member: "Thành viên",
  user: "Nhân viên",
  admin: "Quản trị viên",
  super_admin: "Quản trị cấp cao",
};
