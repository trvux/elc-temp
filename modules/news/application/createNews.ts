import { CreateNewsInput, createNewsSchema } from "../domain";
import { newsRepo } from "../infrastructure";

export async function createNews(input: CreateNewsInput) {
  const validated = createNewsSchema.parse(input);
  return await newsRepo.create(validated as CreateNewsInput);
}
