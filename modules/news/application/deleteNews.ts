import { NewsRepository } from "../domain";

export async function deleteNews(newsRepo: NewsRepository, id: string) {
  return await newsRepo.delete(id);
}
