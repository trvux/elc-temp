import { CreatePageInput, createPageSchema } from "../domain";
import { pageRepo } from "../infrastructure";

export async function createPage(input: CreatePageInput) {
  const validated = createPageSchema.parse(input);
  return await pageRepo.create(validated as CreatePageInput);
}
