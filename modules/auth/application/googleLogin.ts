import { AuthRepository } from "../domain/repository";
import { AuthResponse } from "../domain/types";

export async function googleLogin(
  authRepo: AuthRepository,
  code: string,
  redirectUri: string,
): Promise<AuthResponse> {
  const { user, error } = await authRepo.googleLogin(code, redirectUri);
  return { user, error };
}
