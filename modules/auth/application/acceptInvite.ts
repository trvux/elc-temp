import { AuthRepository } from "../domain/repository";
import { AcceptInviteInput, AuthResponse } from "../domain/types";

export async function acceptInvite(
  authRepo: AuthRepository,
  input: AcceptInviteInput,
): Promise<AuthResponse> {
  const { user, error } = await authRepo.acceptInvite(input);
  return { user, error };
}
