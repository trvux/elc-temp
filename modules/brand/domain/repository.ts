import { Brand, BrandFilter, CreateBrandInput, UpdateBrandInput } from "./types";

export interface BrandRepository {
  getAll(options?: BrandFilter): Promise<Brand[]>;
  count(options?: Pick<BrandFilter, "search" | "includeDeleted">): Promise<number>;
  getById(id: string): Promise<Brand | null>;
  getBySlug(slug: string): Promise<Brand | null>;
  create(input: CreateBrandInput): Promise<Brand>;
  update(input: UpdateBrandInput): Promise<Brand>;
  delete(id: string): Promise<void>;
  getByIds(ids: string[]): Promise<Brand[]>;
}
