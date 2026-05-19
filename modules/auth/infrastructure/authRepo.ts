import { createClient } from "@/shared/lib/supabase/server";
import { AuthRepository, AuthUser, LoginInput } from "../domain";

export class SupabaseAuthRepository implements AuthRepository {
  async getCurrentUser(): Promise<AuthUser | null> {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  }

  async login(
    input: LoginInput,
  ): Promise<{ user: AuthUser | null; error: string | null }> {
    console.log("[SupabaseAuthRepository] Step 3 - Initializing Supabase client and calling signInWithPassword for:", input.email);
    
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: input.email,
        password: input.password,
      });

      if (error) {
        console.warn("[SupabaseAuthRepository] Step 3 - Supabase returned auth error:", error.message);
        return { user: null, error: error.message };
      }

      console.log("[SupabaseAuthRepository] Step 3 - Supabase authenticated user successfully, user email:", data.user?.email);
      return { user: data.user, error: null };
    } catch (err) {
      console.error("[SupabaseAuthRepository] Step 3 - Exception in signInWithPassword:", err);
      return { user: null, error: err instanceof Error ? err.message : "Lỗi kết nối Supabase" };
    }
  }

  async logout(): Promise<{ error: string | null }> {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();
    return { error: error ? error.message : null };
  }
}

export const authRepo = new SupabaseAuthRepository();
