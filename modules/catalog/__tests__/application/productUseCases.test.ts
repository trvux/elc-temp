import { beforeEach, describe, expect, it, vi } from "vitest";
import { createProduct } from "../../application/createProduct";
import { getFeaturedProducts } from "../../application/getFeaturedProducts";
import { getProductBySlug } from "../../application/getProductBySlug";
import { getProducts } from "../../application/getProducts";
import { updateProduct } from "../../application/updateProduct";
import { ProductRepository } from "../../domain/repository";

describe("Product Application Use Cases", () => {
  const VALID_ID = "550e8400-e29b-411d-a716-446655440000";
  const mockProduct = {
    id: VALID_ID,
    name: "iPhone 15 Pro",
    slug: "iphone-15-pro",
    sku: "IP15P-128-BLU",
    shortDescription: "The latest iPhone",
    description: {},
    specs: {},
    originalPrice: 25000000,
    salePrice: 23500000,
    discountPercent: 6,
    images: ["https://example.com/iphone.jpg"],
    isFeatured: true,
    isPublished: true,
    orderIndex: 1,
    categoryId: "550e8400-e29b-411d-a716-446655440001",
    brandId: "550e8400-e29b-411d-a716-446655440002",
    stockStatus: "in_stock" as const,
    condition: "new" as const,
    labels: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deletedAt: null,
  };

  const mockRepo = {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getAll: vi.fn(),
    getById: vi.fn(),
    getBySlug: vi.fn(),
    getByIds: vi.fn(),
    count: vi.fn(),
  } as unknown as ProductRepository;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createProduct", () => {
    it("should validate and create a product", async () => {
      const input = {
        name: "Samsung S24",
        slug: "samsung-s24",
        sku: "S24-256",
        originalPrice: 20000000,
        categoryId: "550e8400-e29b-411d-a716-446655440001",
        brandId: "550e8400-e29b-411d-a716-446655440002",
      };
      vi.mocked(mockRepo.create).mockResolvedValue({
        ...mockProduct,
        ...input,
      });

      const result = await createProduct(mockRepo, input as Parameters<typeof createProduct>[1]);

      expect(mockRepo.create).toHaveBeenCalled();
      expect(result.name).toBe("Samsung S24");
    });

    it("should throw error if validation fails", async () => {
      const input = { name: "" }; // Missing required fields
      await expect(
        createProduct(mockRepo, input as Parameters<typeof createProduct>[1]),
      ).rejects.toThrow();
    });
  });

  describe("updateProduct", () => {
    it("should validate and update a product", async () => {
      const input = { id: VALID_ID, name: "Updated Name" };
      vi.mocked(mockRepo.update).mockResolvedValue({
        ...mockProduct,
        ...input,
      });

      const result = await updateProduct(mockRepo, input as Parameters<typeof updateProduct>[1]);

      expect(mockRepo.update).toHaveBeenCalled();
      expect(result.name).toBe("Updated Name");
    });

    it("should throw error if id is missing", async () => {
      const input = { name: "No ID" };
      await expect(
        updateProduct(mockRepo, input as Parameters<typeof updateProduct>[1]),
      ).rejects.toThrow();
    });
  });

  describe("getProducts", () => {
    it("should return products from repository", async () => {
      vi.mocked(mockRepo.getAll).mockResolvedValue([mockProduct as never]);
      const result = await getProducts(mockRepo);
      expect(result).toHaveLength(1);
      expect(mockRepo.getAll).toHaveBeenCalled();
    });
  });

  describe("getProductBySlug", () => {
    it("should return product by slug", async () => {
      vi.mocked(mockRepo.getBySlug).mockResolvedValue(mockProduct as never);
      const result = await getProductBySlug(mockRepo, "iphone-15-pro");
      expect(result?.slug).toBe("iphone-15-pro");
      expect(mockRepo.getBySlug).toHaveBeenCalledWith("iphone-15-pro");
    });
  });

  describe("getFeaturedProducts", () => {
    it("should call getAll with featured filters", async () => {
      vi.mocked(mockRepo.getAll).mockResolvedValue([mockProduct as never]);
      await getFeaturedProducts(mockRepo, 10);
      expect(mockRepo.getAll).toHaveBeenCalledWith({
        isFeatured: true,
        isPublished: true,
        limit: 10,
      });
    });
  });
});
