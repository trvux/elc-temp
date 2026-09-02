import { AuthRepository } from "../domain/repository";
import { AuthResponse } from "../domain/types";

export async function verifyMagicLinkCode(
  authRepo: AuthRepository,
  email: string,
  code: string,
): Promise<AuthResponse> {
  const { user, error } = await authRepo.verifyMagicLinkCode(email, code);
  return { user, error };
}
