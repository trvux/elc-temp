import { describe, it, expect, vi, beforeEach } from "vitest";
import { SupabaseCategoryRepository } from "../../infrastructure/categoryRepo";

// Definining the mock objects inside vi.hoisted
const { mockSupabase, mockQuery } = vi.hoisted(() => {
  const query = {
    from: vi.fn().mockReturnThis(), // Added to support nested chains if needed
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

describe("SupabaseCategoryRepository", () => {
  let repository: SupabaseCategoryRepository;
  const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new SupabaseCategoryRepository();
    // Re-bind then and chainable methods to mockQuery
    mockQuery.select.mockReturnThis();
    mockQuery.eq.mockReturnThis();
    mockQuery.is.mockReturnThis();
    mockQuery.update.mockReturnThis();
    mockQuery.order.mockReturnThis();
    mockQuery.range.mockReturnThis();
  });

  describe("getById", () => {
    it("should return a category when it exists and not deleted", async () => {
      const mockData = {
        id: VALID_UUID,
        name: "Cat 1",
        slug: "cat-1",
        parent_id: null,
        type: "product",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockQuery.maybeSingle.mockResolvedValue({ data: mockData, error: null });

      const result = await repository.getById(VALID_UUID);

      expect(mockSupabase.from).toHaveBeenCalledWith("categories");
      expect(result?.id).toBe(VALID_UUID);
    });
  });

  describe("getAll", () => {
    it("should filter out deleted categories by default", async () => {
      mockQuery.then.mockImplementation((onfulfilled: any) => onfulfilled({ data: [], error: null }));

      await repository.getAll();

      expect(mockQuery.is).toHaveBeenCalledWith("deleted_at", null);
    });
  });

  describe("delete", () => {
    it("should perform a soft delete", async () => {
      mockQuery.then.mockImplementation((onfulfilled: any) => onfulfilled({ error: null }));

      await repository.delete(VALID_UUID);

      expect(mockQuery.update).toHaveBeenCalledWith(expect.objectContaining({
        deleted_at: expect.any(String),
      }));
    });
  });
});
