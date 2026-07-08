import { AuthRepository } from "../domain/repository";
import { UpdateProfileInput } from "../domain/types";

export async function updateProfile(authRepo: AuthRepository, input: UpdateProfileInput) {
  return authRepo.updateProfile(input);
}
