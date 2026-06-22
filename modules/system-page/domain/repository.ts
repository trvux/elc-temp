import { SystemPage, UpdateSystemPageInput } from "./types";

export interface SystemPageRepository {
  getAll(): Promise<SystemPage[]>;
  getBySlug(slug: string): Promise<SystemPage | null>;
  update(input: UpdateSystemPageInput): Promise<SystemPage>;
}
