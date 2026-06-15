import { CreateNewsInput, createNewsSchema, NewsRepository } from "../domain";

export async function createNews(newsRepo: NewsRepository, input: CreateNewsInput) {
  const validated = createNewsSchema.parse(input);
  return await newsRepo.create(validated as CreateNewsInput);
}
