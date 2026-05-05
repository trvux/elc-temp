import { describe, it, expect } from "vitest";
import { brandSchema, createBrandSchema, updateBrandSchema } from "../../domain/validators";

describe("Brand Domain Validators", () => {
  const validBrand = {
    id: "550e8400-e29b-41d3-a456-426614174000",
    name: "Apple",
    slug: "apple",
    logoUrl: "https://example.com/logo.png",
    description: "Premium technology brand",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    deletedAt: null,
  };

  describe("brandSchema", () => {
    it("should validate a correct brand object", () => {
      const result = brandSchema.safeParse(validBrand);
      expect(result.success).toBe(true);
    });

    it("should fail if id is not a valid UUID", () => {
      const result = brandSchema.safeParse({ ...validBrand, id: "invalid-uuid" });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("ID không đúng định dạng UUID");
      }
    });

    it("should fail if name is empty", () => {
      const result = brandSchema.safeParse({ ...validBrand, name: "" });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Tên thương hiệu không được để trống");
      }
    });

    it("should fail if name is too long", () => {
      const result = brandSchema.safeParse({ ...validBrand, name: "a".repeat(101) });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Tên thương hiệu không được quá 100 ký tự");
      }
    });

    it("should fail if slug is invalid", () => {
      const result = brandSchema.safeParse({ ...validBrand, slug: "Apple Store" });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Slug chỉ được chứa chữ thường, số và dấu gạch ngang");
      }
    });

    it("should fail if logoUrl is an invalid URL", () => {
      const result = brandSchema.safeParse({ ...validBrand, logoUrl: "not-a-url" });
      expect(result.success).toBe(false);
      // For union types, zod might return multiple errors or a nested one
      if (!result.success) {
        const messages = result.error.issues.map(e => e.message);
        expect(messages).toContain("URL logo không hợp lệ");
      }
    });

    it("should allow empty logoUrl", () => {
      const result = brandSchema.safeParse({ ...validBrand, logoUrl: "" });
      expect(result.success).toBe(true);
    });

    it("should allow undefined description", () => {
      const { description, ...rest } = validBrand;
      const result = brandSchema.safeParse(rest);
      expect(result.success).toBe(true);
    });

    it("should allow valid slug with numbers and dashes", () => {
      const result = brandSchema.safeParse({ ...validBrand, slug: "brand-123-test" });
      expect(result.success).toBe(true);
    });

    it("should fail if slug has uppercase letters", () => {
      const result = brandSchema.safeParse({ ...validBrand, slug: "Brand-Slug" });
      expect(result.success).toBe(false);
    });

    it("should fail if createdAt is not ISO format", () => {
      const result = brandSchema.safeParse({ ...validBrand, createdAt: "2024/01/01" });
      expect(result.success).toBe(false);
    });
  });

  describe("createBrandSchema", () => {
    it("should validate a correct create brand input", () => {
      const createInput = {
        name: "Samsung",
        slug: "samsung",
        logoUrl: "https://example.com/samsung.png",
        description: "Electronics brand",
      };
      const result = createBrandSchema.safeParse(createInput);
      expect(result.success).toBe(true);
    });

    it("should fail if required fields are missing", () => {
      const result = createBrandSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("updateBrandSchema", () => {
    it("should validate a correct update brand input", () => {
      const updateInput = {
        id: "550e8400-e29b-41d3-a456-426614174000",
        name: "Apple Updated",
      };
      const result = updateBrandSchema.safeParse(updateInput);
      expect(result.success).toBe(true);
    });

    it("should fail if id is missing in update", () => {
      const result = updateBrandSchema.safeParse({ name: "Apple" });
      expect(result.success).toBe(false);
    });
  });
});
