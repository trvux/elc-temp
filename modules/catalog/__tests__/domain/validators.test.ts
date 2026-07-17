import { describe, it, expect } from "vitest";
import { productSchema, createProductSchema, updateProductSchema } from "../../domain/validators";

describe("Product Validators", () => {
  const validProduct = {
    id: "550e8400-e29b-411d-a716-446655440000",
    name: "iPhone 15 Pro",
    slug: "iphone-15-pro",
    sku: "IP15P-128-BLU",
    description: { content: "Detailed description" },
    originalPrice: 25000000,
    salePrice: 23500000,
    discountPercent: 6,
    images: [{ url: "https://example.com/iphone.jpg" }],
    isFeatured: true,
    isPublished: true,
    orderIndex: 1,
    categoryId: "550e8400-e29b-411d-a716-446655440001",
    brandId: "550e8400-e29b-411d-a716-446655440002",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deletedAt: null,
  };

  describe("productSchema", () => {
    it("should validate a valid product", () => {
      const result = productSchema.safeParse(validProduct);
      expect(result.success).toBe(true);
    });

    it("should fail if name is empty", () => {
      const result = productSchema.safeParse({ ...validProduct, name: "" });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Tên sản phẩm không được để trống");
      }
    });

    it("should fail if slug contains invalid characters", () => {
      const result = productSchema.safeParse({ ...validProduct, slug: "Invalid Slug!" });
      expect(result.success).toBe(false);
    });

    it("should fail if price is negative", () => {
      const result = productSchema.safeParse({ ...validProduct, originalPrice: -100 });
      expect(result.success).toBe(false);
    });

    it("should fail if categoryId is not a UUID", () => {
      const result = productSchema.safeParse({ ...validProduct, categoryId: "not-a-uuid" });
      expect(result.success).toBe(false);
    });
  });

  describe("createProductSchema", () => {
    it("should validate valid create input", () => {
      const { id, createdAt, updatedAt, deletedAt, discountPercent, ...createInput } = validProduct;
      const result = createProductSchema.safeParse(createInput);
      expect(result.success).toBe(true);
    });

    it("should require name, slug, sku, originalPrice, categoryId, and brandId", () => {
      const result = createProductSchema.safeParse({});
      expect(result.success).toBe(false);
      if (!result.success) {
        const paths = result.error.issues.map(e => e.path[0]);
        expect(paths).toContain("name");
        expect(paths).toContain("slug");
        expect(paths).toContain("sku");
        expect(paths).toContain("originalPrice");
        expect(paths).toContain("categoryId");
        expect(paths).toContain("brandId");
      }
    });
  });

  describe("updateProductSchema", () => {
    it("should validate valid update input", () => {
      const updateInput = {
        id: validProduct.id,
        name: "Updated Name",
      };
      const result = updateProductSchema.safeParse(updateInput);
      expect(result.success).toBe(true);
    });

    it("should fail if id is missing in update", () => {
      const result = updateProductSchema.safeParse({ name: "No ID" });
      expect(result.success).toBe(false);
    });
  });
});
