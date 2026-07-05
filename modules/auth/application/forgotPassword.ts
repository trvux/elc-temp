import { AuthRepository } from "../domain/repository";
import { ForgotPasswordInput } from "../domain/types";

export async function forgotPassword(
  authRepo: AuthRepository,
  input: ForgotPasswordInput,
): Promise<{ error: string | null }> {
  return authRepo.forgotPassword(input);
}
