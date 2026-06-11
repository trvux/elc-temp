import { describe, it, expect, vi, beforeEach } from "vitest";
import { SupabaseProductRepository } from "../../infrastructure/SupabaseProductRepository";

const { mockSupabase, mockQuery } = vi.hoisted(() => {
  const query = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn(),
    single: vi.fn(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    then: vi.fn(),
  };
  
  const client = {
    from: vi.fn().mockReturnValue(query),
  };
  
  return { mockSupabase: client, mockQuery: query };
});

vi.mock("@/shared/lib/supabase/server", () => {
  return {
    createClient: vi.fn(async () => mockSupabase),
  };
});

describe("SupabaseProductRepository", () => {
  let repository: SupabaseProductRepository;
  const VALID_UUID = "550e8400-e29b-41d3-a456-426614174000";

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new SupabaseProductRepository();
    mockQuery.select.mockReturnThis();
    mockQuery.eq.mockReturnThis();
    mockQuery.is.mockReturnThis();
    mockQuery.not.mockReturnThis();
    mockQuery.update.mockReturnThis();
    mockQuery.order.mockReturnThis();
    mockQuery.range.mockReturnThis();
    mockQuery.ilike.mockReturnThis();
    mockQuery.limit.mockReturnThis();
  });

  describe("getAll", () => {
    it("should return a list of products with relations", async () => {
      const mockData = [
        { 
            id: "1", 
            name: "iPhone", 
            category: { id: "c1", name: "Mobile", slug: "mobile" },
            brand: { id: "b1", name: "Apple", slug: "apple" }
        },
      ];
      mockQuery.then.mockImplementation((onfulfilled: any) => onfulfilled({ data: mockData, error: null }));

      const result = await repository.getAll();

      expect(mockSupabase.from).toHaveBeenCalledWith("products");
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("iPhone");
      expect(result[0].category?.name).toBe("Mobile");
    });

    it("should apply filters", async () => {
        mockQuery.then.mockImplementation((onfulfilled: any) => onfulfilled({ data: [], error: null }));
        
        await repository.getAll({ categoryId: "c1", brandId: "b1", isFeatured: true });
        
        expect(mockQuery.eq).toHaveBeenCalledWith("category_id", "c1");
        expect(mockQuery.eq).toHaveBeenCalledWith("brand_id", "b1");
        expect(mockQuery.eq).toHaveBeenCalledWith("is_featured", true);
    });
  });

  describe("getById", () => {
    it("should return a product when it exists", async () => {
      const mockData = { id: VALID_UUID, name: "iPhone" };
      mockQuery.maybeSingle.mockResolvedValue({ data: mockData, error: null });

      const result = await repository.getById(VALID_UUID);

      expect(mockQuery.eq).toHaveBeenCalledWith("id", VALID_UUID);
      expect(result?.name).toBe("iPhone");
    });
  });

  describe("create", () => {
    it("should create a new product", async () => {
      const input = { 
        name: "Samsung", 
        slug: "samsung", 
        sku: "S24", 
        originalPrice: 1000,
        categoryId: "c1",
        brandId: "b1"
      };
      const mockData = { id: "2", ...input };
      mockQuery.single.mockResolvedValue({ data: mockData, error: null });

      const result = await repository.create(input as any);

      expect(mockQuery.insert).toHaveBeenCalledWith(expect.objectContaining({ name: "Samsung" }));
      expect(result.name).toBe("Samsung");
    });
  });

  describe("update", () => {
    it("should update an existing product", async () => {
      const input = { id: VALID_UUID, name: "iPhone Updated" };
      const mockData = { ...input, slug: "iphone" };
      mockQuery.single.mockResolvedValue({ data: mockData, error: null });

      const result = await repository.update(input as any);

      expect(mockQuery.update).toHaveBeenCalledWith(expect.objectContaining({ name: "iPhone Updated" }));
      expect(mockQuery.eq).toHaveBeenCalledWith("id", VALID_UUID);
    });
  });

  describe("delete", () => {
    it("should delete a product", async () => {
      mockQuery.then.mockImplementation((onfulfilled: any) => onfulfilled({ error: null }));

      await repository.delete(VALID_UUID);

      expect(mockQuery.update).toHaveBeenCalledWith(expect.objectContaining({
        deleted_at: expect.any(String)
      }));
      expect(mockQuery.eq).toHaveBeenCalledWith("id", VALID_UUID);
    });
  });
});
