import { UpdateNewsInput, updateNewsSchema } from "../domain";
import { newsRepo } from "../infrastructure";

export async function updateNews(input: UpdateNewsInput) {
  const validated = updateNewsSchema.parse(input);
  return await newsRepo.update(validated as UpdateNewsInput);
}
