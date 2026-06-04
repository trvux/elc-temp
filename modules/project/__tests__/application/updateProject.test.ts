import { describe, it, expect, vi, beforeEach } from "vitest";
import { updateProject, toggleProjectPublish } from "../../application/updateProject";
import { projectRepo } from "../../infrastructure/projectRepo";
import { UpdateProjectInput, Project } from "../../domain/types";

// Mock the repository
vi.mock("../../infrastructure/projectRepo", () => ({
  projectRepo: {
    update: vi.fn(),
    togglePublish: vi.fn(),
  },
}));

describe("updateProject Use Case", () => {
  const mockProject: Project = {
    id: "p1",
    title: "Project 1",
    slug: "project-1",
    description: {},
    images: [],
    isFeatured: false,
    isPublished: true,
    orderIndex: 0,
    categoryId: "cat1",
    projectTypeId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deletedAt: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("updateProject", () => {
    it("should update project successfully", async () => {
      const input: UpdateProjectInput = {
        id: "p1",
        title: "Updated Title",
      };

      vi.mocked(projectRepo.update).mockResolvedValue({ ...mockProject, title: "Updated Title" });

      const result = await updateProject(input);

      expect(projectRepo.update).toHaveBeenCalledWith(input);
      expect(result.title).toBe("Updated Title");
    });
  });

  describe("toggleProjectPublish", () => {
    it("should toggle publish status successfully", async () => {
      vi.mocked(projectRepo.togglePublish).mockResolvedValue(undefined);

      await toggleProjectPublish("p1", false);

      expect(projectRepo.togglePublish).toHaveBeenCalledWith("p1", false);
    });
  });
});
