import { SystemPage } from "./types";
import { UpdateSystemPageInput } from "./validators";

export interface SystemPageRepository {
  getAll(): Promise<SystemPage[]>;
  getBySlug(slug: string): Promise<SystemPage | null>;
  update(input: UpdateSystemPageInput): Promise<SystemPage>;
}
