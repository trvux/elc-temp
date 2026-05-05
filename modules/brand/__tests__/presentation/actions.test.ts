import { describe, it, expect, vi, beforeEach } from "vitest";
import { 
  getBrandsAction, 
  createBrandAction, 
  updateBrandAction, 
  deleteBrandAction 
} from "../../presentation/actions";
import * as application from "../../application";
import { revalidatePath } from "next/cache";

vi.mock("../../application", () => ({
  getBrands: vi.fn(),
  createBrand: vi.fn(),
  updateBrand: vi.fn(),
  deleteBrand: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("Brand Server Actions", () => {
  const VALID_ID = "550e8400-e29b-41d3-a456-426614174000";
  const mockBrand = { id: VALID_ID, name: "Apple" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getBrandsAction", () => {
    it("should return data on success", async () => {
      vi.mocked(application.getBrands).mockResolvedValue([mockBrand as any]);
      const result = await getBrandsAction();
      expect(result.data).toHaveLength(1);
      expect(result.error).toBeNull();
    });

    it("should return error message on failure", async () => {
      vi.mocked(application.getBrands).mockRejectedValue(new Error("Network error"));
      const result = await getBrandsAction();
      expect(result.data).toHaveLength(0);
      expect(result.error).toBe("Không thể tải danh sách thương hiệu");
    });
  });

  describe("createBrandAction", () => {
    it("should revalidate path on success", async () => {
      vi.mocked(application.createBrand).mockResolvedValue(mockBrand as any);
      const result = await createBrandAction({ name: "Apple", slug: "apple" });
      expect(result.data).toBeDefined();
      expect(revalidatePath).toHaveBeenCalledWith("/admin/brands");
    });

    it("should return validation error message", async () => {
      vi.mocked(application.createBrand).mockRejectedValue(new Error("Tên thương hiệu không được để trống"));
      const result = await createBrandAction({ name: "", slug: "apple" });
      expect(result.error).toBe("Tên thương hiệu không được để trống");
    });
  });

  describe("deleteBrandAction", () => {
    it("should return success on deletion", async () => {
      vi.mocked(application.deleteBrand).mockResolvedValue();
      const result = await deleteBrandAction(VALID_ID);
      expect(result.success).toBe(true);
      expect(revalidatePath).toHaveBeenCalledWith("/admin/brands");
    });
  });
});
