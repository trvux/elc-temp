import { describe, it, expect, vi, beforeEach } from "vitest";
import { createProduct } from "../../application/createProduct";
import { updateProduct } from "../../application/updateProduct";
import { getProducts } from "../../application/getProducts";
import { getProductBySlug } from "../../application/getProductBySlug";
import { getFeaturedProducts } from "../../application/getFeaturedProducts";
import { productRepo } from "../../infrastructure";

vi.mock("../../infrastructure", () => ({
  productRepo: {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getAll: vi.fn(),
    getById: vi.fn(),
    getBySlug: vi.fn(),
  },
}));

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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deletedAt: null,
  };

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
      vi.mocked(productRepo.create).mockResolvedValue({ ...mockProduct, ...input });

      const result = await createProduct(input as any);

      expect(productRepo.create).toHaveBeenCalled();
      expect(result.name).toBe("Samsung S24");
    });

    it("should throw error if validation fails", async () => {
      const input = { name: "" }; // Missing required fields
      await expect(createProduct(input as any)).rejects.toThrow();
    });
  });

  describe("updateProduct", () => {
    it("should validate and update a product", async () => {
      const input = { id: VALID_ID, name: "Updated Name" };
      vi.mocked(productRepo.update).mockResolvedValue({ ...mockProduct, ...input });

      const result = await updateProduct(input as any);

      expect(productRepo.update).toHaveBeenCalled();
      expect(result.name).toBe("Updated Name");
    });

    it("should throw error if id is missing", async () => {
      const input = { name: "No ID" };
      await expect(updateProduct(input as any)).rejects.toThrow();
    });
  });

  describe("getProducts", () => {
    it("should return products from repository", async () => {
      vi.mocked(productRepo.getAll).mockResolvedValue([mockProduct as any]);
      const result = await getProducts();
      expect(result).toHaveLength(1);
      expect(productRepo.getAll).toHaveBeenCalled();
    });
  });

  describe("getProductBySlug", () => {
    it("should return product by slug", async () => {
      vi.mocked(productRepo.getBySlug).mockResolvedValue(mockProduct as any);
      const result = await getProductBySlug("iphone-15-pro");
      expect(result?.slug).toBe("iphone-15-pro");
      expect(productRepo.getBySlug).toHaveBeenCalledWith("iphone-15-pro");
    });
  });

  describe("getFeaturedProducts", () => {
    it("should call getAll with featured filters", async () => {
      vi.mocked(productRepo.getAll).mockResolvedValue([mockProduct as any]);
      await getFeaturedProducts(10);
      expect(productRepo.getAll).toHaveBeenCalledWith({
        isFeatured: true,
        isPublished: true,
        limit: 10,
      });
    });
  });
});
