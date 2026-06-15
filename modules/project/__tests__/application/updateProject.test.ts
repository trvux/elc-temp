import { describe, it, expect, vi, beforeEach } from "vitest";
import { updateProject, toggleProjectPublish } from "../../application/updateProject";
import { ProjectRepository } from "../../domain/repository";
import { UpdateProjectInput, Project } from "../../domain/types";

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

  const mockRepo = {
    update: vi.fn(),
    togglePublish: vi.fn(),
  } as unknown as ProjectRepository;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("updateProject", () => {
    it("should update project successfully", async () => {
      const input: UpdateProjectInput = {
        id: "p1",
        title: "Updated Title",
      };

      vi.mocked(mockRepo.update).mockResolvedValue({ ...mockProject, title: "Updated Title" });

      const result = await updateProject(mockRepo, input);

      expect(mockRepo.update).toHaveBeenCalledWith(input);
      expect(result.title).toBe("Updated Title");
    });
  });

  describe("toggleProjectPublish", () => {
    it("should toggle publish status successfully", async () => {
      vi.mocked(mockRepo.togglePublish).mockResolvedValue(undefined);

      await toggleProjectPublish(mockRepo, "p1", false);

      expect(mockRepo.togglePublish).toHaveBeenCalledWith("p1", false);
    });
  });
});
