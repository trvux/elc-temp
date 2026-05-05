import { describe, it, expect, vi, beforeEach } from "vitest";
import { SupabaseServiceRepository } from "../../infrastructure/SupabaseServiceRepository";

// Definining the mock objects inside vi.hoisted
const { mockSupabase, mockQuery } = vi.hoisted(() => {
  const query = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn(),
    single: vi.fn(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
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

// Mock using the exact path that the repository uses
vi.mock("@/shared/lib/supabase/server", () => {
  return {
    createClient: vi.fn(async () => mockSupabase),
  };
});

describe("SupabaseServiceRepository", () => {
  let repository: SupabaseServiceRepository;
  const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new SupabaseServiceRepository();
    
    // Default chain behavior
    mockQuery.select.mockReturnThis();
    mockQuery.eq.mockReturnThis();
    mockQuery.is.mockReturnThis();
    mockQuery.order.mockReturnThis();
    mockQuery.range.mockReturnThis();
    mockQuery.ilike.mockReturnThis();
  });

  describe("getById", () => {
    it("should return a service when it exists and not deleted", async () => {
      const mockData = {
        id: VALID_UUID,
        title: "Service 1",
        slug: "service-1",
        image: "",
        content: {},
        is_published: true,
        order_index: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null,
      };

      mockQuery.maybeSingle.mockResolvedValue({ data: mockData, error: null });

      const result = await repository.getById(VALID_UUID);

      expect(mockSupabase.from).toHaveBeenCalledWith("services");
      expect(mockQuery.eq).toHaveBeenCalledWith("id", VALID_UUID);
      expect(mockQuery.is).toHaveBeenCalledWith("deleted_at", null);
      expect(result?.id).toBe(VALID_UUID);
    });

    it("should return null if service is not found", async () => {
      mockQuery.maybeSingle.mockResolvedValue({ data: null, error: null });
      const result = await repository.getById(VALID_UUID);
      expect(result).toBeNull();
    });
  });

  describe("getAll", () => {
    it("should filter out deleted services by default", async () => {
      // Mock the final promise behavior of the query chain
      mockQuery.then.mockImplementation((onfulfilled: any) => onfulfilled({ data: [], error: null }));

      await repository.getAll();

      expect(mockQuery.is).toHaveBeenCalledWith("deleted_at", null);
    });

    it("should apply search filter if provided", async () => {
      mockQuery.then.mockImplementation((onfulfilled: any) => onfulfilled({ data: [], error: null }));

      await repository.getAll({ search: "web" });

      expect(mockQuery.ilike).toHaveBeenCalledWith("title", "%web%");
    });

    it("should apply pagination if provided", async () => {
      mockQuery.then.mockImplementation((onfulfilled: any) => onfulfilled({ data: [], error: null }));

      await repository.getAll({ limit: 10, offset: 20 });

      expect(mockQuery.range).toHaveBeenCalledWith(20, 29);
    });
  });

  describe("create", () => {
    it("should insert a new service and return it", async () => {
      const input = { title: "New", slug: "new" };
      const mockData = { id: VALID_UUID, ...input, is_published: true, order_index: 0 };
      
      mockQuery.single.mockResolvedValue({ data: mockData, error: null });

      const result = await repository.create(input as any);

      expect(mockQuery.insert).toHaveBeenCalledWith(expect.objectContaining({
        title: "New",
        slug: "new",
      }));
      expect(result.title).toBe("New");
    });
  });

  describe("delete", () => {
    it("should perform a soft delete by updating deleted_at", async () => {
      mockQuery.then.mockImplementation((onfulfilled: any) => onfulfilled({ error: null }));

      await repository.delete(VALID_UUID);

      expect(mockQuery.update).toHaveBeenCalledWith(expect.objectContaining({
        deleted_at: expect.any(String),
      }));
      expect(mockQuery.eq).toHaveBeenCalledWith("id", VALID_UUID);
    });
  });
});
