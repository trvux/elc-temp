import { PageFilter, PageRepository } from "../domain";

export async function getPages(pageRepo: PageRepository, options?: PageFilter) {
  return await pageRepo.getAll(options);
}
