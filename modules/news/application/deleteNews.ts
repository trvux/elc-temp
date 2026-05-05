import { newsRepo } from "../infrastructure";

export async function deleteNews(id: string) {
  return await newsRepo.delete(id);
}
