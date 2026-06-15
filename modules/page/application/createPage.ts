import { CreatePageInput, createPageSchema, PageRepository } from "../domain";

export async function createPage(pageRepo: PageRepository, input: CreatePageInput) {
  const validated = createPageSchema.parse(input);
  return await pageRepo.create(validated as CreatePageInput);
}
