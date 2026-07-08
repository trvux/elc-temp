import { AuthRepository } from "../domain/repository";
import { ChangePasswordInput } from "../domain/types";

export async function changePassword(authRepo: AuthRepository, input: ChangePasswordInput) {
  return authRepo.changePassword(input);
}
