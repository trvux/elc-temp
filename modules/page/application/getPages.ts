import { PageFilter } from "../domain";
import { pageRepo } from "../infrastructure";

export async function getPages(options?: PageFilter) {
  return await pageRepo.getAll(options);
}
