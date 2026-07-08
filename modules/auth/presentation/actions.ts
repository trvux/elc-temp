"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  acceptInvite,
  changePassword,
  forgotPassword,
  login,
  logout,
  resetPassword,
  updateProfile,
} from "../application";
import { authRepo } from "../infrastructure/authRepo";
import {
  AcceptInviteInput,
  acceptInviteSchema,
  ChangePasswordInput,
  changePasswordSchema,
  ForgotPasswordInput,
  forgotPasswordSchema,
  LoginInput,
  loginSchema,
  ResetPasswordInput,
  resetPasswordSchema,
  UpdateProfileInput,
  updateProfileSchema,
} from "../domain/types";

export async function loginAction(input: LoginInput) {
  try {
    const validated = loginSchema.parse(input);
    const { error } = await login(authRepo, validated);

    if (error) {
      console.warn("[loginAction] Login failed with error:", error);
      return { error };
    }

    revalidatePath("/", "layout");
  } catch (error) {
    console.error("[loginAction] Exception caught in loginAction:", error);
    return {
      error: error instanceof Error ? error.message : "Đã có lỗi xảy ra",
    };
  }

  // Outside the try/catch — redirect() throws internally and must not be
  // swallowed by the catch block above.
  redirect("/admin");
}

export async function logoutAction() {
  try {
    const { error } = await logout(authRepo);
    if (error) {
      return { success: false, error };
    }

    revalidatePath("/", "layout");
  } catch (error) {
    console.error("logoutAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Đã có lỗi xảy ra",
    };
  }

  // Outside the try/catch, same reason as loginAction — redirect server-side
  // instead of returning success and letting the client orchestrate
  // router.push + router.refresh, which can race with the admin layout's own
  // redirect once it notices the session cookie is gone.
  redirect("/admin/login");
}

export async function forgotPasswordAction(input: ForgotPasswordInput) {
  try {
    const validated = forgotPasswordSchema.parse(input);
    return await forgotPassword(authRepo, validated);
  } catch (error) {
    console.error("[forgotPasswordAction] Exception:", error);
    return { error: error instanceof Error ? error.message : "Đã có lỗi xảy ra" };
  }
}

export async function resetPasswordAction(input: ResetPasswordInput) {
  try {
    const validated = resetPasswordSchema.parse(input);
    return await resetPassword(authRepo, validated);
  } catch (error) {
    console.error("[resetPasswordAction] Exception:", error);
    return { error: error instanceof Error ? error.message : "Đã có lỗi xảy ra" };
  }
}

export async function acceptInviteAction(input: AcceptInviteInput) {
  try {
    const validated = acceptInviteSchema.parse(input);
    return await acceptInvite(authRepo, validated);
  } catch (error) {
    console.error("[acceptInviteAction] Exception:", error);
    return {
      user: null,
      error: error instanceof Error ? error.message : "Đã có lỗi xảy ra",
    };
  }
}

export async function updateProfileAction(input: UpdateProfileInput) {
  try {
    const validated = updateProfileSchema.parse(input);
    const result = await updateProfile(authRepo, validated);
    if (!result.error) {
      revalidatePath("/", "layout");
    }
    return result;
  } catch (error) {
    console.error("[updateProfileAction] Exception:", error);
    return {
      user: null,
      error: error instanceof Error ? error.message : "Đã có lỗi xảy ra",
    };
  }
}

export async function changePasswordAction(input: ChangePasswordInput) {
  let result: { error: string | null };
  try {
    const validated = changePasswordSchema.parse(input);
    result = await changePassword(authRepo, validated);
  } catch (error) {
    console.error("[changePasswordAction] Exception:", error);
    return { error: error instanceof Error ? error.message : "Đã có lỗi xảy ra" };
  }

  if (result.error) {
    return result;
  }

  // Every session (including this one) was just revoked server-side — same
  // reasoning as logoutAction for redirecting outside the try/catch instead
  // of letting the client orchestrate navigation.
  redirect("/admin/login");
}
