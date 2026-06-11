import { describe, it, expect, vi, beforeEach } from "vitest";
import { SupabaseBrandRepository } from "../../infrastructure/brandRepo";

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

describe("SupabaseBrandRepository", () => {
  let repository: SupabaseBrandRepository;
  const VALID_UUID = "550e8400-e29b-41d3-a456-426614174000";

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new SupabaseBrandRepository();
    mockQuery.select.mockReturnThis();
    mockQuery.eq.mockReturnThis();
    mockQuery.is.mockReturnThis();
    mockQuery.not.mockReturnThis();
    mockQuery.update.mockReturnThis();
    mockQuery.order.mockReturnThis();
    mockQuery.range.mockReturnThis();
    mockQuery.ilike.mockReturnThis();
  });

  describe("getAll", () => {
    it("should return a list of brands", async () => {
      const mockData = [
        { id: "1", name: "Apple", slug: "apple", logo_url: "url", description: "desc", created_at: "2024-01-01" },
      ];
      mockQuery.then.mockImplementation((onfulfilled: any) => onfulfilled({ data: mockData, error: null }));

      const result = await repository.getAll();

      expect(mockSupabase.from).toHaveBeenCalledWith("brands");
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Apple");
    });

    it("should apply search filter if provided", async () => {
      mockQuery.then.mockImplementation((onfulfilled: any) => onfulfilled({ data: [], error: null }));
      
      await repository.getAll({ search: "App" });
      
      expect(mockQuery.ilike).toHaveBeenCalledWith("name", "%App%");
    });
  });

  describe("getById", () => {
    it("should return a brand when it exists", async () => {
      const mockData = { id: VALID_UUID, name: "Apple", slug: "apple" };
      mockQuery.maybeSingle.mockResolvedValue({ data: mockData, error: null });

      const result = await repository.getById(VALID_UUID);

      expect(mockQuery.eq).toHaveBeenCalledWith("id", VALID_UUID);
      expect(result?.name).toBe("Apple");
    });

    it("should return null when brand does not exist", async () => {
      mockQuery.maybeSingle.mockResolvedValue({ data: null, error: null });
      const result = await repository.getById(VALID_UUID);
      expect(result).toBeNull();
    });
  });

  describe("create", () => {
    it("should create a new brand", async () => {
      const input = { name: "Samsung", slug: "samsung" };
      const mockData = { id: "2", ...input };
      mockQuery.single.mockResolvedValue({ data: mockData, error: null });

      const result = await repository.create(input);

      expect(mockQuery.insert).toHaveBeenCalledWith(expect.objectContaining({ name: "Samsung" }));
      expect(result.name).toBe("Samsung");
    });
  });

  describe("update", () => {
    it("should update an existing brand", async () => {
      const input = { id: VALID_UUID, name: "Apple Updated" };
      const mockData = { ...input, slug: "apple" };
      mockQuery.single.mockResolvedValue({ data: mockData, error: null });

      const result = await repository.update(input);

      expect(mockQuery.update).toHaveBeenCalledWith(expect.objectContaining({ name: "Apple Updated" }));
      expect(mockQuery.eq).toHaveBeenCalledWith("id", VALID_UUID);
      expect(result.name).toBe("Apple Updated");
    });
  });

  describe("count", () => {
    it("should return the total number of brands", async () => {
      mockQuery.then.mockImplementation((onfulfilled: any) => onfulfilled({ count: 5, error: null }));
      const result = await repository.count();
      expect(result).toBe(5);
    });
  });

  describe("getByIds", () => {
    it("should return brands for a list of ids", async () => {
      const mockData = [{ id: "1", name: "Apple" }, { id: "2", name: "Samsung" }];
      mockQuery.then.mockImplementation((onfulfilled: any) => onfulfilled({ data: mockData, error: null }));
      
      const result = await repository.getByIds(["1", "2"]);
      
      expect(mockQuery.in).toHaveBeenCalledWith("id", ["1", "2"]);
      expect(result).toHaveLength(2);
    });
  });

  describe("delete", () => {
    it("should delete a brand", async () => {
      mockQuery.then.mockImplementation((onfulfilled: any) => onfulfilled({ error: null }));

      await repository.delete(VALID_UUID);

      expect(mockQuery.update).toHaveBeenCalledWith(expect.objectContaining({
        deleted_at: expect.any(String)
      }));
      expect(mockQuery.eq).toHaveBeenCalledWith("id", VALID_UUID);
    });
  });
});
