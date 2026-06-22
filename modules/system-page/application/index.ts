import { SystemPageRepository } from "../domain/repository";
import { UpdateSystemPageInput, SystemPage, updateSystemPageSchema } from "../domain";

export async function getSystemPages(repo: SystemPageRepository): Promise<SystemPage[]> {
  return repo.getAll();
}

export async function getSystemPageBySlug(repo: SystemPageRepository, slug: string): Promise<SystemPage | null> {
  return repo.getBySlug(slug);
}

export async function updateSystemPage(repo: SystemPageRepository, input: UpdateSystemPageInput): Promise<SystemPage> {
  const validated = updateSystemPageSchema.parse(input);
  return repo.update(validated);
}
