import { describe, it, expect, vi, beforeEach } from "vitest";
import { SupabaseProjectRepository } from "../../infrastructure/projectRepo";

const { mockSupabase, mockQuery } = vi.hoisted(() => {
  const query = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
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

describe("SupabaseProjectRepository", () => {
  let repository: SupabaseProjectRepository;
  const VALID_UUID = "550e8400-e29b-41d3-a456-426614174000";

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new SupabaseProjectRepository();
    mockQuery.select.mockReturnThis();
    mockQuery.eq.mockReturnThis();
    mockQuery.neq.mockReturnThis();
    mockQuery.is.mockReturnThis();
    mockQuery.not.mockReturnThis();
    mockQuery.update.mockReturnThis();
    mockQuery.order.mockReturnThis();
    mockQuery.range.mockReturnThis();
    mockQuery.ilike.mockReturnThis();
    mockQuery.limit.mockReturnThis();
    mockQuery.maybeSingle.mockResolvedValue({ data: null, error: null });
    mockQuery.single.mockResolvedValue({ data: null, error: null });
  });

  describe("getAll", () => {
    it("should return a list of projects with categories", async () => {
      const mockData = [
        {
          id: "1",
          title: "Project 1",
          slug: "p1",
          category_id: "c1",
          project_category: [
            {
              condition: "new",
              category: {
                id: "c1",
                name: "Cat 1",
                group_id: "g1",
                group_categories: {
                  id: "g1",
                  name: "Group 1",
                },
              },
            },
          ],
        },
      ];
      mockQuery.then.mockImplementation((onfulfilled: any) => onfulfilled({ data: mockData, error: null }));

      const result = await repository.getAll();

      expect(mockSupabase.from).toHaveBeenCalledWith("projects");
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("Project 1");
      expect(result[0].categories?.[0]?.name).toBe("Cat 1");
    });

    it("should apply filters correctly", async () => {
      mockQuery.then.mockImplementation((onfulfilled: any) => onfulfilled({ data: [], error: null }));
      
      await repository.getAll({ categoryId: "c1", isPublished: true, search: "test" });
      
      expect(mockQuery.eq).toHaveBeenCalledWith("category_id", "c1");
      expect(mockQuery.eq).toHaveBeenCalledWith("is_published", true);
      expect(mockQuery.ilike).toHaveBeenCalledWith("title", "%test%");
    });
  });

  describe("getById", () => {
    it("should return a project when it exists", async () => {
      const mockData = { id: VALID_UUID, title: "P1", category_id: "c1" };
      mockQuery.maybeSingle.mockResolvedValue({ data: mockData, error: null });

      const result = await repository.getById(VALID_UUID);

      expect(mockQuery.eq).toHaveBeenCalledWith("id", VALID_UUID);
      expect(result?.title).toBe("P1");
    });
  });

  describe("create", () => {
    it("should create a project", async () => {
      const input = { title: "New", slug: "new", categoryId: VALID_UUID };
      const mockData = { id: "new-id", ...input, category_id: VALID_UUID };
      mockQuery.single.mockResolvedValue({ data: mockData, error: null });

      const result = await repository.create(input);

      expect(mockQuery.insert).toHaveBeenCalledWith(expect.objectContaining({ title: "New" }));
      expect(result.id).toBe("new-id");
    });
  });

  describe("delete", () => {
    it("should perform soft delete", async () => {
      mockQuery.then.mockImplementation((onfulfilled: any) => onfulfilled({ error: null }));

      await repository.delete(VALID_UUID);

      expect(mockQuery.update).toHaveBeenCalledWith(expect.objectContaining({ 
          deleted_at: expect.any(String) 
      }));
      expect(mockQuery.eq).toHaveBeenCalledWith("id", VALID_UUID);
    });
  });

  describe("togglePublish", () => {
    it("should update is_published status", async () => {
        mockQuery.then.mockImplementation((onfulfilled: any) => onfulfilled({ error: null }));
        
        await repository.togglePublish(VALID_UUID, true);
        
        expect(mockQuery.update).toHaveBeenCalledWith({ is_published: true });
        expect(mockQuery.eq).toHaveBeenCalledWith("id", VALID_UUID);
    });
  });

  describe("getRelated", () => {
      it("should fetch related projects excluding current one", async () => {
          mockQuery.then.mockImplementation((onfulfilled: any) => onfulfilled({ data: [], error: null }));
          
          await repository.getRelated("p1", "c1", 5);
          
          expect(mockQuery.eq).toHaveBeenCalledWith("category_id", "c1");
          expect(mockQuery.neq).toHaveBeenCalledWith("id", "p1");
          expect(mockQuery.limit).toHaveBeenCalledWith(5);
      });
  });
});
