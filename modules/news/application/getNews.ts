import { NewsFilter } from "../domain";
import { newsRepo } from "../infrastructure";


export async function getNews(options?: NewsFilter) {
  return await newsRepo.getAll(options);
}
