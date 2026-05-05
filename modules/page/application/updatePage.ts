import { UpdatePageInput, updatePageSchema } from "../domain";
import { pageRepo } from "../infrastructure";

export async function updatePage(input: UpdatePageInput) {
  const validated = updatePageSchema.parse(input);
  return await pageRepo.update(validated as UpdatePageInput);
}
