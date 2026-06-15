import { AuthRepository } from "../domain/repository";
import { AuthUser } from "../domain/types";

export async function getCurrentUser(authRepo: AuthRepository): Promise<AuthUser | null> {
  return authRepo.getCurrentUser();
}
