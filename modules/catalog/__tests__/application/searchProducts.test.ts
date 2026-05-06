import { describe, it, expect, vi, beforeEach } from "vitest";
import { searchProducts } from "../../application/searchProducts";
import { productRepo } from "../../infrastructure/SupabaseProductRepository";

vi.mock("../../infrastructure/SupabaseProductRepository", () => ({
  productRepo: {
    getAll: vi.fn(),
  },
}));

describe("searchProducts Use Case", () => {
  const mockProducts = [
    {
      id: "1",
      name: "Apple iPhone 15",
      originalPrice: 20000000,
      salePrice: 18000000,
      createdAt: "2024-01-01T00:00:00Z",
      brandId: "apple-id",
      isPublished: true,
      specs: [{ label: "Dung lượng", value: "128GB" }],
      brand: { name: "Apple" }
    },
    {
      id: "2",
      name: "Samsung Galaxy S24",
      originalPrice: 15000000,
      salePrice: 0,
      createdAt: "2024-02-01T00:00:00Z",
      brandId: "samsung-id",
      isPublished: true,
      specs: [{ label: "Dung lượng", value: "256GB" }],
      brand: { name: "Samsung" }
    },
    {
      id: "3",
      name: "Apple MacBook Pro",
      originalPrice: 40000000,
      salePrice: 35000000,
      createdAt: "2024-03-15T00:00:00Z",
      brandId: "apple-id",
      isPublished: true,
      specs: [{ label: "RAM", value: "16GB" }],
      brand: { name: "Apple" }
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(productRepo.getAll).mockResolvedValue(mockProducts as any);
  });

  describe("Sorting Logic", () => {
    it("should sort by price_asc correctly (handling salePrice vs originalPrice)", async () => {
      const { products } = await searchProducts("", { sortBy: "price_asc" });
      // Prices: 
      // S24: 15M (salePrice 0 -> use originalPrice 15M)
      // iPhone: 18M (salePrice 18M)
      // MacBook: 35M (salePrice 35M)
      expect(products[0].id).toBe("2");
      expect(products[1].id).toBe("1");
      expect(products[2].id).toBe("3");
    });

    it("should sort by price_desc correctly", async () => {
      const { products } = await searchProducts("", { sortBy: "price_desc" });
      expect(products[0].id).toBe("3");
      expect(products[1].id).toBe("1");
      expect(products[2].id).toBe("2");
    });

    it("should sort by newest correctly", async () => {
      const { products } = await searchProducts("", { sortBy: "newest" });
      expect(products[0].id).toBe("3"); // March
      expect(products[1].id).toBe("2"); // February
      expect(products[2].id).toBe("1"); // January
    });
  });

  describe("Filtering Logic", () => {
    it("should filter by brandIds", async () => {
      const { products } = await searchProducts("", { brandIds: ["apple-id"] });
      expect(products).toHaveLength(2);
      expect(products.every(p => p.brandId === "apple-id")).toBe(true);
    });

    it("should filter by specs (simple match)", async () => {
      const { products } = await searchProducts("", { 
        specs: { "Dung lượng": ["256GB"] } 
      });
      expect(products).toHaveLength(1);
      expect(products[0].id).toBe("2");
    });

    it("should filter by price range", async () => {
      const { products } = await searchProducts("", { 
        minPrice: 20000000,
        maxPrice: 40000000
      });
      // Only MacBook (35M) matches. iPhone (18M) and S24 (15M) are excluded.
      expect(products).toHaveLength(1);
      expect(products[0].id).toBe("3");
    });
  });

  describe("Fuzzy Search Logic", () => {
    it("should find products by name", async () => {
      const { products } = await searchProducts("iPhone");
      expect(products).toHaveLength(1);
      expect(products[0].name).toContain("iPhone");
    });

    it("should find products by spec content", async () => {
      const { products } = await searchProducts("256GB");
      expect(products).toHaveLength(1);
      expect(products[0].id).toBe("2");
    });
  });
});
