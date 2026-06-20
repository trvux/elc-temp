import { describe, it, expect, vi, beforeEach } from "vitest";
import { SupabaseNewsRepository } from "../../infrastructure/SupabaseNewsRepository";

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

describe("SupabaseNewsRepository", () => {
  let repository: SupabaseNewsRepository;
  const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new SupabaseNewsRepository();
    
    mockQuery.select.mockReturnThis();
    mockQuery.eq.mockReturnThis();
    mockQuery.is.mockReturnThis();
    mockQuery.order.mockReturnThis();
  });

  describe("getById", () => {
    it("should return news when it exists", async () => {
      const mockData = {
        id: VALID_UUID,
        title: "News 1",
        slug: "news-1",
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

      expect(mockSupabase.from).toHaveBeenCalledWith("news");
      expect(mockQuery.eq).toHaveBeenCalledWith("id", VALID_UUID);
      expect(result?.id).toBe(VALID_UUID);
    });
  });

  describe("getAll", () => {
    it("should filter out deleted news", async () => {
      mockQuery.then.mockImplementation((onfulfilled: (res: { data: unknown[]; error: null }) => unknown) => onfulfilled({ data: [], error: null }));
      await repository.getAll();
      expect(mockQuery.is).toHaveBeenCalledWith("deleted_at", null);
    });

    it("should order by order_index ascending by default", async () => {
      mockQuery.then.mockImplementation((onfulfilled: (res: { data: unknown[]; error: null }) => unknown) => onfulfilled({ data: [], error: null }));
      await repository.getAll();
      expect(mockQuery.order).toHaveBeenCalledWith("order_index", { ascending: true });
    });

    it("should order by custom field and direction when specified", async () => {
      mockQuery.then.mockImplementation((onfulfilled: (res: { data: unknown[]; error: null }) => unknown) => onfulfilled({ data: [], error: null }));
      await repository.getAll({ sortBy: "created_at", sortOrder: "desc" });
      expect(mockQuery.order).toHaveBeenCalledWith("created_at", { ascending: false });
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
