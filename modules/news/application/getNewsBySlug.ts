import { NewsRepository } from "../domain";

export async function getNewsBySlug(newsRepo: NewsRepository, slug: string) {
  return await newsRepo.getBySlug(slug);
}
