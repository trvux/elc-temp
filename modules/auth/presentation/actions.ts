"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { googleLogin, logout, requestMagicLink, updateProfile, verifyMagicLinkCode, verifyMagicLinkToken } from "../application";
import { authRepo } from "../infrastructure/authRepo";
import {
  AuthResponse,
  RequestMagicLinkInput,
  requestMagicLinkSchema,
  UpdateProfileInput,
  updateProfileSchema,
  VerifyMagicLinkCodeInput,
  verifyMagicLinkCodeSchema,
} from "../domain/types";

// googleLoginAction/verifyMagicLinkCodeAction/verifyMagicLinkTokenAction are
// all called from client code through react-query's useMutation/useQuery
// (see modules/auth/presentation/hooks) — NOT via a <form action> or a plain
// awaited call the way logoutAction below is. redirect() thrown from inside
// an action invoked that way surfaces to the caller as a genuine rejected
// promise (react-query's global MutationCache.onError then shows it as a
// "NEXT_REDIRECT" toast, even though navigation still quietly happens
// underneath), instead of being intercepted by Next's router the way it is
// for a form/plain-call action. So these three deliberately do NOT redirect
// server-side — they just return { user, error } and the calling hook
// navigates client-side based on user.role once the mutation/query resolves.
export async function googleLoginAction(code: string): Promise<AuthResponse> {
  try {
    const result = await googleLogin(authRepo, code);
    if (result.error) {
      console.warn("[googleLoginAction] Login failed with error:", result.error);
    } else {
      revalidatePath("/", "layout");
    }
    return result;
  } catch (error) {
    console.error("[googleLoginAction] Exception:", error);
    return { user: null, error: error instanceof Error ? error.message : "Đã có lỗi xảy ra" };
  }
}

export async function requestMagicLinkAction(input: RequestMagicLinkInput) {
  try {
    const validated = requestMagicLinkSchema.parse(input);
    return await requestMagicLink(authRepo, validated);
  } catch (error) {
    console.error("[requestMagicLinkAction] Exception:", error);
    return { error: error instanceof Error ? error.message : "Đã có lỗi xảy ra" };
  }
}

export async function verifyMagicLinkCodeAction(input: VerifyMagicLinkCodeInput): Promise<AuthResponse> {
  try {
    const validated = verifyMagicLinkCodeSchema.parse(input);
    const result = await verifyMagicLinkCode(authRepo, validated.email, validated.code);
    if (!result.error) {
      revalidatePath("/", "layout");
    }
    return result;
  } catch (error) {
    console.error("[verifyMagicLinkCodeAction] Exception:", error);
    return { user: null, error: error instanceof Error ? error.message : "Đã có lỗi xảy ra" };
  }
}

export async function verifyMagicLinkTokenAction(token: string): Promise<AuthResponse> {
  try {
    const result = await verifyMagicLinkToken(authRepo, token);
    if (!result.error) {
      revalidatePath("/", "layout");
    }
    return result;
  } catch (error) {
    console.error("[verifyMagicLinkTokenAction] Exception:", error);
    return { user: null, error: error instanceof Error ? error.message : "Đã có lỗi xảy ra" };
  }
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

  // Outside the try/catch, same reason as googleLoginAction — redirect
  // server-side instead of returning success and letting the client
  // orchestrate router.push + router.refresh, which can race with the admin
  // layout's own redirect once it notices the session cookie is gone.
  redirect("/login");
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
