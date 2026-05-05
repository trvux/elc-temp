import { describe, it, expect } from "vitest";
import { categorySchema, createCategorySchema, updateCategorySchema } from "../../domain/validators";

describe("Category Domain Validators", () => {
  const validCategory = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    name: "Electronics",
    slug: "electronics",
    parentId: null,
    type: "PRODUCT",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    deletedAt: null,
  };

  describe("categorySchema", () => {
    it("should validate a correct category", () => {
      const result = categorySchema.safeParse(validCategory);
      expect(result.success).toBe(true);
    });

    it("should fail if id is not a UUID", () => {
      const result = categorySchema.safeParse({ ...validCategory, id: "invalid-id" });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("ID không đúng định dạng UUID");
      }
    });

    it("should fail if name is empty", () => {
      const result = categorySchema.safeParse({ ...validCategory, name: "" });
      expect(result.success).toBe(false);
    });

    it("should fail if slug is invalid", () => {
      const result = categorySchema.safeParse({ ...validCategory, slug: "Invalid Slug!" });
      expect(result.success).toBe(false);
    });

    it("should fail if type is invalid", () => {
      const result = categorySchema.safeParse({ ...validCategory, type: "INVALID_TYPE" });
      expect(result.success).toBe(false);
    });

    it("should allow null parentId", () => {
      const result = categorySchema.safeParse({ ...validCategory, parentId: null });
      expect(result.success).toBe(true);
    });

    it("should fail if parentId is invalid UUID", () => {
      const result = categorySchema.safeParse({ ...validCategory, parentId: "not-a-uuid" });
      expect(result.success).toBe(false);
    });
  });

  describe("createCategorySchema", () => {
    const validCreateInput = {
      name: "New Category",
      slug: "new-category",
      parentId: null,
      type: "PROJECT",
    };

    it("should validate a correct create input", () => {
      const result = createCategorySchema.safeParse(validCreateInput);
      expect(result.success).toBe(true);
    });

    it("should fail if name is missing", () => {
      const result = createCategorySchema.safeParse({ ...validCreateInput, name: undefined });
      expect(result.success).toBe(false);
    });
  });

  describe("updateCategorySchema", () => {
    const validUpdateInput = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "Updated Name",
    };

    it("should validate a correct update input", () => {
      const result = updateCategorySchema.safeParse(validUpdateInput);
      expect(result.success).toBe(true);
    });

    it("should fail if id is missing", () => {
      const result = updateCategorySchema.safeParse({ name: "Only Name" });
      expect(result.success).toBe(false);
    });

    it("should allow partial updates", () => {
      const result = updateCategorySchema.safeParse({ 
        id: "550e8400-e29b-41d4-a716-446655440000",
        type: "PRODUCT" 
      });
      expect(result.success).toBe(true);
    });
  });
});
