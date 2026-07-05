"use server";

import { revalidatePath } from "next/cache";

import { authHeaders, toSnakeCaseBody } from "@/shared/lib/go-api";
import type { Role } from "@/modules/auth";

import { AdminUser, InviteUserInput, inviteUserSchema } from "../domain/types";

const GO_API_URL = process.env.GO_API_URL;

interface GoUserResponse {
  id: string;
  username: string;
  email: string;
  name: string;
  phone: string;
  role: string;
  status: string;
  last_login_at: string | null;
}

interface GoErrorResponse {
  code: string;
  message: string;
  fields?: Record<string, string[]>;
}

function mapGoUser(row: GoUserResponse): AdminUser {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    name: row.name,
    phone: row.phone,
    role: row.role as Role,
    status: row.status as AdminUser["status"],
    lastLoginAt: row.last_login_at,
  };
}

async function extractErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const body = (await res.json()) as GoErrorResponse;
    return body.message || fallback;
  } catch {
    return fallback;
  }
}

export async function getAdminUsersAction() {
  if (!GO_API_URL) {
    return { data: [] as AdminUser[], error: null };
  }
  try {
    const res = await fetch(`${GO_API_URL}/admin/users`, {
      headers: await authHeaders(),
      cache: "no-store",
    });
    if (!res.ok) {
      return { data: [], error: await extractErrorMessage(res, "Không thể tải danh sách người dùng") };
    }

    const rows = (await res.json()) as GoUserResponse[] | null;
    return { data: (rows ?? []).map(mapGoUser), error: null };
  } catch (error) {
    console.error("getAdminUsersAction error:", error);
    return { data: [], error: "Không thể tải danh sách người dùng" };
  }
}

export async function inviteUserAction(input: InviteUserInput) {
  if (!GO_API_URL) {
    return { error: "GO_API_URL is not configured" };
  }
  try {
    const validated = inviteUserSchema.parse(input);
    const res = await fetch(`${GO_API_URL}/admin/invites`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
      body: JSON.stringify(toSnakeCaseBody(validated)),
    });
    if (!res.ok) {
      return { error: await extractErrorMessage(res, "Không thể gửi lời mời") };
    }
    return { error: null };
  } catch (error) {
    console.error("inviteUserAction error:", error);
    return { error: error instanceof Error ? error.message : "Không thể gửi lời mời" };
  }
}

export async function updateUserRoleAction(id: string, role: Role) {
  if (!GO_API_URL) {
    return { data: null, error: "GO_API_URL is not configured" };
  }
  try {
    const res = await fetch(`${GO_API_URL}/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
      body: JSON.stringify({ role }),
    });
    if (!res.ok) {
      return { data: null, error: await extractErrorMessage(res, "Không thể đổi vai trò") };
    }
    const row = (await res.json()) as GoUserResponse;
    revalidatePath("/admin/users");
    return { data: mapGoUser(row), error: null };
  } catch (error) {
    console.error("updateUserRoleAction error:", error);
    return { data: null, error: "Không thể đổi vai trò" };
  }
}

export async function updateUserStatusAction(id: string, status: "active" | "disabled") {
  if (!GO_API_URL) {
    return { data: null, error: "GO_API_URL is not configured" };
  }
  try {
    const res = await fetch(`${GO_API_URL}/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      return { data: null, error: await extractErrorMessage(res, "Không thể cập nhật trạng thái") };
    }
    const row = (await res.json()) as GoUserResponse;
    revalidatePath("/admin/users");
    return { data: mapGoUser(row), error: null };
  } catch (error) {
    console.error("updateUserStatusAction error:", error);
    return { data: null, error: "Không thể cập nhật trạng thái" };
  }
}
