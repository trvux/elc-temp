import { AuthRepository } from "../domain/repository";
import { LoginInput, AuthResponse } from "../domain/types";

export async function login(authRepo: AuthRepository, input: LoginInput): Promise<AuthResponse> {
  const { user, error } = await authRepo.login(input);
  return { user, error };
}
