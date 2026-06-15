import { NewsFilter, NewsRepository } from "../domain";

export async function getNews(newsRepo: NewsRepository, options?: NewsFilter) {
  return await newsRepo.getAll(options);
}
