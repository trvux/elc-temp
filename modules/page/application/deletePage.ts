import { PageRepository } from "../domain";

export async function deletePage(pageRepo: PageRepository, id: string) {
  return await pageRepo.delete(id);
}
