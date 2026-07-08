import { Tag, TagFilter, CreateTagInput, UpdateTagInput } from "./types";

export interface TagRepository {
  getAll(options?: TagFilter): Promise<Tag[]>;
  getById(id: string): Promise<Tag | null>;
  getBySlug(slug: string): Promise<Tag | null>;
  create(input: CreateTagInput): Promise<Tag>;
  update(input: UpdateTagInput): Promise<Tag>;
  delete(id: string): Promise<void>;
}
