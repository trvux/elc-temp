import { AuthRepository } from "../domain/repository";
import { RequestMagicLinkInput } from "../domain/types";

export async function requestMagicLink(
  authRepo: AuthRepository,
  input: RequestMagicLinkInput,
): Promise<{ error: string | null }> {
  return authRepo.requestMagicLink(input);
}
