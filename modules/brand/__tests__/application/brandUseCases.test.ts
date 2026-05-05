import { describe, it, expect, vi, beforeEach } from "vitest";
import { createBrand } from "../../application/createBrand";
import { updateBrand } from "../../application/updateBrand";
import { deleteBrand } from "../../application/deleteBrand";
import { getBrands } from "../../application/getBrands";
import { getBrandById } from "../../application/getBrandById";
import { getBrandBySlug } from "../../application/getBrandBySlug";
import { brandRepo } from "../../infrastructure/brandRepo";

vi.mock("../../infrastructure/brandRepo", () => ({
  brandRepo: {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getAll: vi.fn(),
    getById: vi.fn(),
    getBySlug: vi.fn(),
  },
}));

describe("Brand Application Use Cases", () => {
  const VALID_ID = "550e8400-e29b-41d3-a456-426614174000";
  const mockBrand = {
    id: VALID_ID,
    name: "Apple",
    slug: "apple",
    logoUrl: "",
    description: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deletedAt: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createBrand", () => {
    it("should validate and create a brand", async () => {
      const input = { name: "Samsung", slug: "samsung" };
      vi.mocked(brandRepo.create).mockResolvedValue({ ...mockBrand, ...input });

      const result = await createBrand(input);

      expect(brandRepo.create).toHaveBeenCalled();
      expect(result.name).toBe("Samsung");
    });

    it("should throw error if validation fails", async () => {
      const input = { name: "", slug: "samsung" };
      await expect(createBrand(input as any)).rejects.toThrow();
    });
  });

  describe("updateBrand", () => {
    it("should validate and update a brand", async () => {
      const input = { id: VALID_ID, name: "Apple Updated" };
      vi.mocked(brandRepo.update).mockResolvedValue({ ...mockBrand, ...input });

      const result = await updateBrand(input);

      expect(brandRepo.update).toHaveBeenCalled();
      expect(result.name).toBe("Apple Updated");
    });

    it("should throw error if id is missing", async () => {
      const input = { name: "Apple Updated" };
      await expect(updateBrand(input as any)).rejects.toThrow();
    });
  });

  describe("getBrands", () => {
    it("should return all brands from repository", async () => {
      vi.mocked(brandRepo.getAll).mockResolvedValue([mockBrand]);
      const result = await getBrands();
      expect(result).toHaveLength(1);
      expect(brandRepo.getAll).toHaveBeenCalled();
    });
  });

  describe("getBrandById", () => {
    it("should return brand by id", async () => {
      vi.mocked(brandRepo.getById).mockResolvedValue(mockBrand);
      const result = await getBrandById(VALID_ID);
      expect(result?.id).toBe(VALID_ID);
      expect(brandRepo.getById).toHaveBeenCalledWith(VALID_ID);
    });
  });

  describe("deleteBrand", () => {
    it("should call repository delete", async () => {
      vi.mocked(brandRepo.delete).mockResolvedValue();
      await deleteBrand(VALID_ID);
      expect(brandRepo.delete).toHaveBeenCalledWith(VALID_ID);
    });
  });
});
