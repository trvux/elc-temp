import { newsRepo } from "../infrastructure";

export async function getNewsBySlug(slug: string) {
  return await newsRepo.getBySlug(slug);
}
