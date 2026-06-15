import { PageRepository } from "../domain";

export async function getPageBySlug(pageRepo: PageRepository, slug: string) {
  return await pageRepo.getBySlug(slug);
}
