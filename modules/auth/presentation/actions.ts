"use server";

import { login, logout } from "../application";
import { LoginInput, loginSchema } from "../domain/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function loginAction(input: LoginInput) {
  try {
    const validated = loginSchema.parse(input);
    const { user, error } = await login(validated);

    if (error) {
      return { data: null, error };
    }

    revalidatePath("/", "layout");
    return { data: user, error: null };
  } catch (error) {
    console.error("loginAction error:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Đã có lỗi xảy ra",
    };
  }
}

export async function logoutAction() {
  try {
    const { error } = await logout();
    if (error) {
      return { success: false, error };
    }

    revalidatePath("/", "layout");
    return { success: true, error: null };
  } catch (error) {
    console.error("logoutAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Đã có lỗi xảy ra",
    };
  }
}
