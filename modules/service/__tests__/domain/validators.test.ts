import { describe, it, expect } from "vitest";
import { serviceSchema, createServiceSchema, updateServiceSchema } from "../../domain/validators";

describe("Service Domain Validators", () => {
  const validService = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    title: "Web Development",
    slug: "web-development",
    image: "https://example.com/image.jpg",
    content: { blocks: [] },
    isPublished: true,
    orderIndex: 1,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    deletedAt: null,
  };

  describe("serviceSchema", () => {
    it("should validate a correct service", () => {
      const result = serviceSchema.safeParse(validService);
      expect(result.success).toBe(true);
    });

    it("should fail if id is not a UUID", () => {
      const result = serviceSchema.safeParse({ ...validService, id: "invalid-id" });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("ID không đúng định dạng UUID");
      }
    });

    it("should fail if title is empty", () => {
      const result = serviceSchema.safeParse({ ...validService, title: "" });
      expect(result.success).toBe(false);
    });

    it("should fail if slug is invalid", () => {
      const result = serviceSchema.safeParse({ ...validService, slug: "Invalid Slug!" });
      expect(result.success).toBe(false);
    });

    it("should allow empty image", () => {
      const result = serviceSchema.safeParse({ ...validService, image: "" });
      expect(result.success).toBe(true);
    });
  });

  describe("createServiceSchema", () => {
    const validCreateInput = {
      title: "New Service",
      slug: "new-service",
      image: "https://example.com/img.png",
      content: {},
      isPublished: false,
      orderIndex: 0,
    };

    it("should validate a correct create input", () => {
      const result = createServiceSchema.safeParse(validCreateInput);
      expect(result.success).toBe(true);
    });

    it("should fail if title is missing", () => {
      const result = createServiceSchema.safeParse({ ...validCreateInput, title: undefined });
      expect(result.success).toBe(false);
    });
  });

  describe("updateServiceSchema", () => {
    const validUpdateInput = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      title: "Updated Title",
    };

    it("should validate a correct update input", () => {
      const result = updateServiceSchema.safeParse(validUpdateInput);
      expect(result.success).toBe(true);
    });

    it("should fail if id is missing", () => {
      const result = updateServiceSchema.safeParse({ title: "Only Title" });
      expect(result.success).toBe(false);
    });

    it("should allow partial updates", () => {
      const result = updateServiceSchema.safeParse({ 
        id: "550e8400-e29b-41d4-a716-446655440000",
        isPublished: true 
      });
      expect(result.success).toBe(true);
    });
  });
});
