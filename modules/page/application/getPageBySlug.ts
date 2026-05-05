import { pageRepo } from "../infrastructure";

export async function getPageBySlug(slug: string) {
  return await pageRepo.getBySlug(slug);
}
