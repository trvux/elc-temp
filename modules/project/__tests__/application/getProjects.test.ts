import { describe, it, expect, vi, beforeEach } from "vitest";
import { getProjects, countProjects } from "../../application/getProjects";
import { projectRepo } from "../../infrastructure/projectRepo";
import { ProjectWithCategory } from "../../domain/types";

// Mock the repository
vi.mock("../../infrastructure/projectRepo", () => ({
  projectRepo: {
    getAll: vi.fn(),
    count: vi.fn(),
  },
}));

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
      serviceTypeId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
      category: { id: "cat1", name: "Category 1", slug: "cat-1" },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getProjects", () => {
    it("should call repository.getAll with correct options", async () => {
      const options = { isPublished: true, limit: 10 };
      vi.mocked(projectRepo.getAll).mockResolvedValue(mockProjects);

      const result = await getProjects(options);

      expect(projectRepo.getAll).toHaveBeenCalledWith(options);
      expect(result).toEqual(mockProjects);
    });

    it("should return empty array if no projects found", async () => {
      vi.mocked(projectRepo.getAll).mockResolvedValue([]);
      const result = await getProjects();
      expect(result).toEqual([]);
    });
  });

  describe("countProjects", () => {
    it("should call repository.count with correct options", async () => {
      const options = { search: "test" };
      vi.mocked(projectRepo.count).mockResolvedValue(5);

      const result = await countProjects(options);

      expect(projectRepo.count).toHaveBeenCalledWith(options);
      expect(result).toBe(5);
    });
  });
});
