import { pageRepo } from "../infrastructure";

export async function deletePage(id: string) {
  return await pageRepo.delete(id);
}
