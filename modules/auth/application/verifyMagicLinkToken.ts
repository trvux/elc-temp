import { AuthRepository } from "../domain/repository";
import { AuthResponse } from "../domain/types";

export async function verifyMagicLinkToken(authRepo: AuthRepository, token: string): Promise<AuthResponse> {
  const { user, error } = await authRepo.verifyMagicLinkToken(token);
  return { user, error };
}
