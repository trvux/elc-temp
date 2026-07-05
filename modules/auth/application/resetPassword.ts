import { AuthRepository } from "../domain/repository";
import { ResetPasswordInput } from "../domain/types";

export async function resetPassword(
  authRepo: AuthRepository,
  input: ResetPasswordInput,
): Promise<{ error: string | null }> {
  return authRepo.resetPassword(input);
}
