import { UpdatePageInput, updatePageSchema, PageRepository } from "../domain";

export async function updatePage(pageRepo: PageRepository, input: UpdatePageInput) {
  const validated = updatePageSchema.parse(input);
  return await pageRepo.update(validated as UpdatePageInput);
}
