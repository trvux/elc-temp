import { describe, it, expect, vi, beforeEach } from "vitest";
import { createNews, updateNews, deleteNews, getNews, getNewsBySlug } from "../../application";
import { newsRepo } from "../../infrastructure";
import { News, CreateNewsInput, UpdateNewsInput } from "../../domain/types";

// Mock the repository
vi.mock("../../infrastructure", () => ({
  newsRepo: {
    getAll: vi.fn(),
    getById: vi.fn(),
    getBySlug: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("News Application Use Cases", () => {
  const mockNewsId = "550e8400-e29b-41d4-a716-446655440000";
  const mockNews: News = {
    id: mockNewsId,
    title: "Test News",
    slug: "test-news",
    image: "",
    content: {},
    isPublished: true,
    orderIndex: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deletedAt: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getNews", () => {
    it("should call repository.getAll", async () => {
      vi.mocked(newsRepo.getAll).mockResolvedValue([mockNews]);
      const result = await getNews();
      expect(newsRepo.getAll).toHaveBeenCalled();
      expect(result).toEqual([mockNews]);
    });
  });

  describe("createNews", () => {
    it("should validate and create news", async () => {
      const input: CreateNewsInput = { title: "New", slug: "new" };
      vi.mocked(newsRepo.create).mockResolvedValue({ ...mockNews, ...input });
      const result = await createNews(input);
      expect(newsRepo.create).toHaveBeenCalled();
      expect(result.title).toBe("New");
    });
  });

  describe("deleteNews", () => {
    it("should call repository.delete", async () => {
      vi.mocked(newsRepo.delete).mockResolvedValue(undefined);
      await deleteNews(mockNewsId);
      expect(newsRepo.delete).toHaveBeenCalledWith(mockNewsId);
    });
  });
});
