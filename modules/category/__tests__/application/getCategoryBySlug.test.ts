import { describe, it, expect, vi, beforeEach } from "vitest";
import { getCategoryBySlug, getCategoryIdsBySlug } from "../../application/getCategoryBySlug";
import { categoryRepo } from "../../infrastructure/categoryRepo";
import { Category } from "../../domain/types";

vi.mock("../../infrastructure/categoryRepo", () => ({
  categoryRepo: {
    getBySlug: vi.fn(),
    getChildren: vi.fn(),
  },
}));

describe("getCategoryBySlug Use Cases", () => {
  const mockCategory: Category = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    name: "Electronics",
    slug: "electronics",
    parentId: null,
    type: "PRODUCT",
    createdAt: "",
    updatedAt: "",
    deletedAt: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getCategoryBySlug", () => {
    it("should return category from repo", async () => {
      vi.mocked(categoryRepo.getBySlug).mockResolvedValue(mockCategory);
      const result = await getCategoryBySlug("electronics");
      expect(result).toEqual(mockCategory);
      expect(categoryRepo.getBySlug).toHaveBeenCalledWith("electronics");
    });
  });

  describe("getCategoryIdsBySlug", () => {
    it("should return parent ID and all children IDs", async () => {
      vi.mocked(categoryRepo.getBySlug).mockResolvedValue(mockCategory);
      vi.mocked(categoryRepo.getChildren).mockResolvedValue([
        { ...mockCategory, id: "550e8400-e29b-41d4-a716-446655440001", parentId: "550e8400-e29b-41d4-a716-446655440000" },
        { ...mockCategory, id: "550e8400-e29b-41d4-a716-446655440002", parentId: "550e8400-e29b-41d4-a716-446655440000" },
      ]);

      const ids = await getCategoryIdsBySlug("electronics");

      expect(ids).toEqual([
        "550e8400-e29b-41d4-a716-446655440000", 
        "550e8400-e29b-41d4-a716-446655440001", 
        "550e8400-e29b-41d4-a716-446655440002"
      ]);
      expect(categoryRepo.getChildren).toHaveBeenCalledWith("550e8400-e29b-41d4-a716-446655440000");
    });

    it("should return only parent ID if no children", async () => {
      vi.mocked(categoryRepo.getBySlug).mockResolvedValue(mockCategory);
      vi.mocked(categoryRepo.getChildren).mockResolvedValue([]);

      const ids = await getCategoryIdsBySlug("electronics");

      expect(ids).toEqual(["550e8400-e29b-41d4-a716-446655440000"]);
    });

    it("should return empty array if category not found", async () => {
      vi.mocked(categoryRepo.getBySlug).mockResolvedValue(null);

      const ids = await getCategoryIdsBySlug("invalid");

      expect(ids).toEqual([]);
      expect(categoryRepo.getChildren).not.toHaveBeenCalled();
    });
  });
});
