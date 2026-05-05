import { authRepo } from "../infrastructure/authRepo";
import { AuthUser } from "../domain/types";

export async function getCurrentUser(): Promise<AuthUser | null> {
  return authRepo.getCurrentUser();
}
