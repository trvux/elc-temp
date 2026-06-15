import { UpdateNewsInput, updateNewsSchema, NewsRepository } from "../domain";

export async function updateNews(newsRepo: NewsRepository, input: UpdateNewsInput) {
  const validated = updateNewsSchema.parse(input);
  return await newsRepo.update(validated as UpdateNewsInput);
}
