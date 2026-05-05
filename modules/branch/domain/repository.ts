import { Branch, CreateBranchInput, UpdateBranchInput } from "./types";

export interface BranchFilter {
  isPublished?: boolean;
  limit?: number;
  offset?: number;
  search?: string;
}

export interface BranchRepository {
  getAll(options?: BranchFilter): Promise<Branch[]>;
  count(options?: Pick<BranchFilter, "isPublished" | "search">): Promise<number>;
  getById(id: string): Promise<Branch | null>;
  getBySlug(slug: string): Promise<Branch | null>;
  create(input: CreateBranchInput): Promise<Branch>;
  update(input: UpdateBranchInput): Promise<Branch>;
  delete(id: string): Promise<void>;
  updateOrder(id: string, orderIndex: number): Promise<void>;
}
