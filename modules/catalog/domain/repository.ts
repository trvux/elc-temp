import { Product, ProductWithRelations, CreateProductInput, UpdateProductInput, ProductFilter } from "./types";

export interface ProductRepository {
  getAll(options?: ProductFilter): Promise<ProductWithRelations[]>;
  count(options?: ProductFilter): Promise<number>;
  getById(id: string): Promise<ProductWithRelations | null>;
  getBySlug(slug: string): Promise<ProductWithRelations | null>;
  create(input: CreateProductInput): Promise<Product>;
  update(input: UpdateProductInput): Promise<Product>;
  delete(id: string): Promise<void>;
  getByIds(ids: string[]): Promise<Product[]>;
}
