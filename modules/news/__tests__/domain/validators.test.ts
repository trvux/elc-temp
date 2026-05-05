import { describe, it, expect } from "vitest";
import { newsSchema, createNewsSchema, updateNewsSchema } from "../../domain/validators";

describe("News Domain Validators", () => {
  const validNews = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    title: "Project Launch",
    slug: "project-launch",
    image: "https://example.com/image.jpg",
    content: { blocks: [] },
    isPublished: true,
    orderIndex: 1,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    deletedAt: null,
  };

  describe("newsSchema", () => {
    it("should validate a correct news item", () => {
      const result = newsSchema.safeParse(validNews);
      expect(result.success).toBe(true);
    });

    it("should fail if id is not a UUID", () => {
      const result = newsSchema.safeParse({ ...validNews, id: "invalid-id" });
      expect(result.success).toBe(false);
    });

    it("should fail if title is empty", () => {
      const result = newsSchema.safeParse({ ...validNews, title: "" });
      expect(result.success).toBe(false);
    });
  });

  describe("createNewsSchema", () => {
    const validCreateInput = {
      title: "New Article",
      slug: "new-article",
      image: "https://example.com/img.png",
      content: {},
      isPublished: false,
      orderIndex: 0,
    };

    it("should validate a correct create input", () => {
      const result = createNewsSchema.safeParse(validCreateInput);
      expect(result.success).toBe(true);
    });
  });

  describe("updateNewsSchema", () => {
    it("should allow partial updates", () => {
      const result = updateNewsSchema.safeParse({ 
        id: "550e8400-e29b-41d4-a716-446655440000",
        isPublished: true 
      });
      expect(result.success).toBe(true);
    });
  });
});
