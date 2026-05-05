import { describe, it, expect, vi, beforeEach } from "vitest";
import { updateCategory } from "../../application/updateCategory";
import { categoryRepo } from "../../infrastructure/categoryRepo";
import { UpdateCategoryInput, Category } from "../../domain/types";

// Mock the repository
vi.mock("../../infrastructure/categoryRepo", () => ({
  categoryRepo: {
    getById: vi.fn(),
    update: vi.fn(),
    getChildren: vi.fn(),
  },
}));

describe("updateCategory Use Case", () => {
  const mockParentId = "550e8400-e29b-41d4-a716-446655440000";
  const mockChildId = "550e8400-e29b-41d4-a716-446655440001";

  const mockParentCategory: Category = {
    id: mockParentId,
    name: "Parent",
    slug: "parent",
    parentId: null,
    type: "PRODUCT",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deletedAt: null,
  };

  const mockChildCategory: Category = {
    id: mockChildId,
    name: "Child",
    slug: "parent-child",
    parentId: mockParentId,
    type: "PRODUCT",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deletedAt: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should update a category successfully without propagation if it is not a parent", async () => {
    const input: UpdateCategoryInput = {
      id: mockChildId,
      name: "Updated Child",
    };

    vi.mocked(categoryRepo.getById).mockResolvedValue(mockChildCategory);
    vi.mocked(categoryRepo.update).mockResolvedValue({ ...mockChildCategory, name: "Updated Child" });

    const result = await updateCategory(input);

    expect(result.name).toBe("Updated Child");
    expect(categoryRepo.update).toHaveBeenCalledTimes(1);
    expect(categoryRepo.getChildren).not.toHaveBeenCalled();
  });

  it("should propagate slug change to children when parent slug is updated", async () => {
    const input: UpdateCategoryInput = {
      id: mockParentId,
      slug: "new-parent",
    };

    const updatedParent: Category = { ...mockParentCategory, slug: "new-parent" };

    vi.mocked(categoryRepo.getById).mockResolvedValue(mockParentCategory);
    vi.mocked(categoryRepo.update).mockResolvedValueOnce(updatedParent);
    vi.mocked(categoryRepo.getChildren).mockResolvedValue([mockChildCategory]);

    await updateCategory(input);

    // Should call update for parent
    expect(categoryRepo.update).toHaveBeenCalledWith(expect.objectContaining({
      id: mockParentId,
      slug: "new-parent",
    }));

    // Should call update for child with new slug prefix
    // childInternalSlug = "child" (from "parent-child")
    // newChildSlug = "new-parent-child"
    expect(categoryRepo.update).toHaveBeenCalledWith(expect.objectContaining({
      id: mockChildId,
      slug: "new-parent-child",
    }));
  });

  it("should propagate type change to children when parent type is updated", async () => {
    const input: UpdateCategoryInput = {
      id: mockParentId,
      type: "PROJECT",
    };

    const updatedParent: Category = { ...mockParentCategory, type: "PROJECT" };

    vi.mocked(categoryRepo.getById).mockResolvedValue(mockParentCategory);
    vi.mocked(categoryRepo.update).mockResolvedValueOnce(updatedParent);
    vi.mocked(categoryRepo.getChildren).mockResolvedValue([mockChildCategory]);

    await updateCategory(input);

    // Should call update for child with new type
    expect(categoryRepo.update).toHaveBeenCalledWith(expect.objectContaining({
      id: mockChildId,
      type: "PROJECT",
    }));
  });

  it("should throw error if category not found", async () => {
    const input: UpdateCategoryInput = {
      id: "550e8400-e29b-41d4-a716-446655440001",
      name: "Fail",
    };

    vi.mocked(categoryRepo.getById).mockResolvedValue(null);

    await expect(updateCategory(input)).rejects.toThrow("Category not found");
  });

  it("should throw validation error if input is invalid", async () => {
    const input = {
      id: "invalid-uuid",
      name: "",
    };

    await expect(updateCategory(input as UpdateCategoryInput)).rejects.toThrow();
  });

  it("should propagate changes for mid-level categories (not just root)", async () => {
    // Parent is a child of Root, but has its own Child
    const midLevelCategory: Category = {
      ...mockChildCategory,
      id: "550e8400-e29b-41d4-a716-446655440002",
      name: "Mid Level",
      slug: "root-mid",
      parentId: "root-id",
    };

    const subChildCategory: Category = {
      ...mockChildCategory,
      id: "550e8400-e29b-41d4-a716-446655440003",
      name: "Sub Child",
      slug: "root-mid-sub",
      parentId: midLevelCategory.id,
    };

    const input: UpdateCategoryInput = {
      id: midLevelCategory.id,
      slug: "root-newmid",
    };

    const updatedMid: Category = { ...midLevelCategory, slug: "root-newmid" };

    vi.mocked(categoryRepo.getById).mockResolvedValue(midLevelCategory);
    vi.mocked(categoryRepo.update).mockResolvedValue(updatedMid); // mockResolvedValue instead of Once
    vi.mocked(categoryRepo.getChildren).mockResolvedValue([subChildCategory]);

    await updateCategory(input);

    // Should call update for sub-child
    expect(categoryRepo.update).toHaveBeenCalledWith(expect.objectContaining({
      id: subChildCategory.id,
      slug: "root-newmid-sub",
    }));
  });

  it("should propagate changes to multiple children", async () => {
    const child1: Category = { ...mockChildCategory, id: "child-1", slug: "parent-c1" };
    const child2: Category = { ...mockChildCategory, id: "child-2", slug: "parent-c2" };

    const input: UpdateCategoryInput = {
      id: mockParentId,
      type: "PROJECT",
    };

    const updatedParent: Category = { ...mockParentCategory, type: "PROJECT" };

    vi.mocked(categoryRepo.getById).mockResolvedValue(mockParentCategory);
    vi.mocked(categoryRepo.update).mockResolvedValue(updatedParent);
    vi.mocked(categoryRepo.getChildren).mockResolvedValue([child1, child2]);

    await updateCategory(input);

    expect(categoryRepo.update).toHaveBeenCalledTimes(3); // Parent + 2 children
    expect(categoryRepo.update).toHaveBeenCalledWith(expect.objectContaining({ id: "child-1", type: "PROJECT" }));
    expect(categoryRepo.update).toHaveBeenCalledWith(expect.objectContaining({ id: "child-2", type: "PROJECT" }));
  });
});
