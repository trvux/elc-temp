import { authRepo } from "../infrastructure/authRepo";

export async function logout(): Promise<{ error: string | null }> {
  return authRepo.logout();
}
