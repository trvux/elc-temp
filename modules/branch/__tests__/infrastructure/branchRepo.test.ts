import { describe, it, expect } from "vitest";
import { BranchRepository } from "../../domain/repository";
import { mockBranches } from "../../domain/mocks";

export const mockBranchRepo: BranchRepository = {
  getAll: async () => mockBranches,
  count: async () => mockBranches.length,
  getById: async (id) => mockBranches.find((b) => b.id === id) || null,
  getBySlug: async (slug) => mockBranches.find((b) => b.slug === slug) || null,
  create: async (input) => {
    const newBranch = {
      ...input,
      id: `br-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    };
    return newBranch;
  },
  update: async (input) => {
    const existing = mockBranches.find((b) => b.id === input.id);
    if (!existing) throw new Error("Not found");
    return { ...existing, ...input, updatedAt: new Date().toISOString() };
  },
  delete: async (id) => {
    // mock delete
  },
  updateOrder: async (id, orderIndex) => {
    // mock update order
  },
};

describe("Branch Infrastructure Mocks", () => {
  describe("getAll & count", () => {
    it("should return all mock branches", async () => {
      const branches = await mockBranchRepo.getAll();
      expect(branches).toHaveLength(mockBranches.length);
    });

    it("should return the correct total count of branches", async () => {
      const count = await mockBranchRepo.count();
      expect(count).toBe(mockBranches.length);
    });
  });

  describe("getById", () => {
    it("should return a branch when given a valid, existing ID", async () => {
      const existingId = mockBranches[0].id;
      const branch = await mockBranchRepo.getById(existingId);
      expect(branch).toBeDefined();
      expect(branch?.id).toBe(existingId);
    });

    it("should return null when given a non-existent ID (Corner Case)", async () => {
      const branch = await mockBranchRepo.getById("non-existent-id-999");
      expect(branch).toBeNull();
    });

    it("should return null when given an empty string ID (Edge Case)", async () => {
      const branch = await mockBranchRepo.getById("");
      expect(branch).toBeNull();
    });
  });

  describe("getBySlug", () => {
    it("should return a branch when given a valid slug", async () => {
      const existingSlug = mockBranches[0].slug;
      const branch = await mockBranchRepo.getBySlug(existingSlug);
      expect(branch).toBeDefined();
      expect(branch?.slug).toBe(existingSlug);
    });

    it("should return null for an unmatched slug", async () => {
      const branch = await mockBranchRepo.getBySlug("invalid-slug-xyz");
      expect(branch).toBeNull();
    });
  });

  describe("create", () => {
    it("should successfully create and return a new branch with generated ID and timestamps", async () => {
      const newBranchInput = {
        name: "Chi nhánh Test",
        slug: "chi-nhanh-test",
        address: "123 Test Street",
        phone: "0123456789",
        email: "test@elc.vn",
        mapsUrl: "https://maps.google.com/test",
        mapsEmbed: "https://maps.google.com/embed/test",
        description: "Test description",
        isPublished: true,
        orderIndex: 3,
      };

      const result = await mockBranchRepo.create(newBranchInput);
      expect(result.id).toContain("br-");
      expect(result.name).toBe(newBranchInput.name);
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
      expect(result.deletedAt).toBeNull();
    });
  });

  describe("update", () => {
    it("should update an existing branch and modify the updatedAt timestamp", async () => {
      const existingId = mockBranches[0].id;
      const updateInput = {
        id: existingId,
        name: "Tên mới update",
      };

      const result = await mockBranchRepo.update(updateInput);
      expect(result.id).toBe(existingId);
      expect(result.name).toBe("Tên mới update");
      // Các trường khác giữ nguyên
      expect(result.slug).toBe(mockBranches[0].slug);
    });

    it("should throw an error when trying to update a non-existent branch (Edge Case)", async () => {
      const updateInput = {
        id: "invalid-id-to-update",
        name: "Impossible Update",
      };

      await expect(mockBranchRepo.update(updateInput)).rejects.toThrow("Not found");
    });
  });
});
