import { describe, it, expect, vi, beforeEach } from "vitest";
import { getProjects, countProjects } from "../../application/getProjects";
import { ProjectRepository } from "../../domain/repository";
import { ProjectWithCategory } from "../../domain/types";

describe("getProjects & countProjects Use Case", () => {
  const mockProjects: ProjectWithCategory[] = [
    {
      id: "p1",
      title: "Project 1",
      slug: "project-1",
      description: {},
      images: [],
      isFeatured: false,
      isPublished: true,
      orderIndex: 0,
      categoryId: "cat1",
      services: [],
      projectTypeId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
      category: { id: "cat1", name: "Category 1", slug: "cat-1" },
    },
  ];

  const mockRepo = {
    getAll: vi.fn(),
    count: vi.fn(),
  } as unknown as ProjectRepository;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getProjects", () => {
    it("should call repository.getAll with correct options", async () => {
      const options = { isPublished: true, limit: 10 };
      vi.mocked(mockRepo.getAll).mockResolvedValue(mockProjects);

      const result = await getProjects(mockRepo, options);

      expect(mockRepo.getAll).toHaveBeenCalledWith(options);
      expect(result).toEqual(mockProjects);
    });

    it("should return empty array if no projects found", async () => {
      vi.mocked(mockRepo.getAll).mockResolvedValue([]);
      const result = await getProjects(mockRepo);
      expect(result).toEqual([]);
    });
  });

  describe("countProjects", () => {
    it("should call repository.count with correct options", async () => {
      const options = { search: "test" };
      vi.mocked(mockRepo.count).mockResolvedValue(5);

      const result = await countProjects(mockRepo, options);

      expect(mockRepo.count).toHaveBeenCalledWith(options);
      expect(result).toBe(5);
    });
  });
});
