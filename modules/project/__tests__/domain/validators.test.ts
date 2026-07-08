import { describe, it, expect } from "vitest";
import { projectSchema, createProjectSchema, updateProjectSchema } from "../../domain/validators";

describe("Project Domain Validators", () => {
  const validProject = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    title: "Eco Green Tower",
    slug: "eco-green-tower",
    description: { content: "Modern apartment complex" },
    images: [{ url: "https://example.com/image1.jpg" }],
    isFeatured: true,
    isPublished: true,
    orderIndex: 1,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    deletedAt: null,
  };

  describe("projectSchema", () => {
    it("should validate a correct project", () => {
      const result = projectSchema.safeParse(validProject);
      expect(result.success).toBe(true);
    });

    it("should fail if id is not a UUID", () => {
      const result = projectSchema.safeParse({ ...validProject, id: "invalid-id" });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("ID không đúng định dạng UUID");
      }
    });

    it("should fail if title is empty", () => {
      const result = projectSchema.safeParse({ ...validProject, title: "" });
      expect(result.success).toBe(false);
    });

    it("should fail if slug is invalid", () => {
      const result = projectSchema.safeParse({ ...validProject, slug: "Invalid Slug!" });
      expect(result.success).toBe(false);
    });

    it("should fail if images are not URLs", () => {
      const result = projectSchema.safeParse({ ...validProject, images: [{ url: "not-a-url" }] });
      expect(result.success).toBe(false);
    });

    it("should validate even if description is a string (Json type support)", () => {
        const result = projectSchema.safeParse({ ...validProject, description: "Just a string" });
        expect(result.success).toBe(true);
    });
  });

  describe("createProjectSchema", () => {
    const validCreateInput = {
      title: "New Project",
      slug: "new-project",
    };

    it("should validate a correct create input", () => {
      const result = createProjectSchema.safeParse(validCreateInput);
      expect(result.success).toBe(true);
    });
  });

  describe("updateProjectSchema", () => {
    const validUpdateInput = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      title: "Updated Title",
    };

    it("should validate a correct update input", () => {
      const result = updateProjectSchema.safeParse(validUpdateInput);
      expect(result.success).toBe(true);
    });

    it("should allow updating only isPublished", () => {
        const result = updateProjectSchema.safeParse({
            id: "550e8400-e29b-41d4-a716-446655440000",
            isPublished: false
        });
        expect(result.success).toBe(true);
    });
  });
});
