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
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });

    if (error) {
      return { user: null, error: error.message };
    }

    return { user: data.user, error: null };
  }

  async logout(): Promise<{ error: string | null }> {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();
    return { error: error ? error.message : null };
  }
}

export const authRepo = new SupabaseAuthRepository();
