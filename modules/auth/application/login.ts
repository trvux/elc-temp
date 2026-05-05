import { authRepo } from "../infrastructure/authRepo";
import { LoginInput, AuthResponse } from "../domain/types";

export async function login(input: LoginInput): Promise<AuthResponse> {
  const { user, error } = await authRepo.login(input);
  return { user, error };
}
