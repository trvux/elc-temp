import { describe, it, expect, vi, beforeEach } from "vitest";
import { searchProducts } from "../../application/searchProducts";
import { ProductRepository } from "../../domain/repository";

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
      specs: [{ label: "Dung luong", value: "128GB" }],
      brand: { name: "Apple", slug: "apple" },
    },
    {
      id: "2",
      name: "Samsung Galaxy S24",
      originalPrice: 15000000,
      salePrice: 0,
      createdAt: "2024-02-01T00:00:00Z",
      brandId: "samsung-id",
      isPublished: true,
      specs: [{ label: "Dung luong", value: "256GB" }],
      brand: { name: "Samsung", slug: "samsung" },
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
      brand: { name: "Apple", slug: "apple" },
    },
  ];

  const mockRepo = {
    getAll: vi.fn(),
  } as unknown as ProductRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(mockRepo.getAll).mockResolvedValue(mockProducts as never);
  });

  describe("Sorting Logic", () => {
    it("should sort by price_asc correctly (handling salePrice vs originalPrice)", async () => {
      const { products } = await searchProducts(mockRepo, "", { sortBy: "price_asc" });
      // Prices:
      // S24: 15M (salePrice 0 -> use originalPrice 15M)
      // iPhone: 18M (salePrice 18M)
      // MacBook: 35M (salePrice 35M)
      expect(products[0].id).toBe("2");
      expect(products[1].id).toBe("1");
      expect(products[2].id).toBe("3");
    });

    it("should sort by price_desc correctly", async () => {
      const { products } = await searchProducts(mockRepo, "", { sortBy: "price_desc" });
      expect(products[0].id).toBe("3");
      expect(products[1].id).toBe("1");
      expect(products[2].id).toBe("2");
    });

    it("should sort by newest correctly", async () => {
      const { products } = await searchProducts(mockRepo, "", { sortBy: "newest" });
      expect(products[0].id).toBe("3"); // March
      expect(products[1].id).toBe("2"); // February
      expect(products[2].id).toBe("1"); // January
    });
  });

  describe("Filtering Logic", () => {
    it("should filter by brandIds", async () => {
      const { products } = await searchProducts(mockRepo, "", { brandIds: ["apple-id"] });
      expect(products).toHaveLength(2);
      expect(products.every((p) => p.brandId === "apple-id")).toBe(true);
    });

    it("should filter by price range", async () => {
      const { products } = await searchProducts(mockRepo, "", {
        minPrice: 20000000,
        maxPrice: 40000000,
      });
      // Only MacBook (35M) matches. iPhone (18M) and S24 (15M) are excluded.
      expect(products).toHaveLength(1);
      expect(products[0].id).toBe("3");
    });
  });

  describe("Fuzzy Search Logic", () => {
    it("should find products by name", async () => {
      const { products } = await searchProducts(mockRepo, "iPhone");
      expect(products).toHaveLength(1);
      expect(products[0].name).toContain("iPhone");
    });
  });
});
