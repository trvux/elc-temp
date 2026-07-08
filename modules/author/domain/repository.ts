import { Author, AuthorFilter, CreateAuthorInput, UpdateAuthorInput } from "./types";

export interface AuthorRepository {
  getAll(options?: AuthorFilter): Promise<Author[]>;
  getById(id: string): Promise<Author | null>;
  getBySlug(slug: string): Promise<Author | null>;
  create(input: CreateAuthorInput): Promise<Author>;
  update(input: UpdateAuthorInput): Promise<Author>;
  delete(id: string): Promise<void>;
}
