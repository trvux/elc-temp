import { AuthRepository } from "../domain/repository";

export async function logout(authRepo: AuthRepository): Promise<{ error: string | null }> {
  return authRepo.logout();
}
