import { createClient } from "@/shared/lib/supabase/server";
import { Tables, Insert, Update } from "@/shared/types/supabase";
import { 
  Category, 
  CategoryType, 
  CategoryWithChildren, 
  CreateCategoryInput, 
  UpdateCategoryInput 
} from "../domain/types";
import { CategoryFilter, CategoryRepository } from "../domain/repository";
import { CATEGORY_TYPES } from "../domain/constants";

type CategoryRow = Tables<"categories">;
type CategoryInsert = Insert<"categories">;
type CategoryUpdate = Update<"categories">;

export class SupabaseCategoryRepository implements CategoryRepository {
  private readonly TABLE_NAME = "categories";

  async getAll(options?: CategoryFilter): Promise<Category[]> {
    const supabase = await createClient();
    let query = supabase.from(this.TABLE_NAME).select("*");

    if (!options?.includeDeleted) {
      query = query.is("deleted_at", null);
    }

    if (options?.type) {
      query = query.eq("type", CATEGORY_TYPES[options.type]);
    }
    if (options?.parentId !== undefined) {
      if (options.parentId === null) {
        query = query.is("parent_id", null);
      } else {
        query = query.eq("parent_id", options.parentId);
      }
    }
    if (options?.search) {
      query = query.ilike("name", `%${options.search}%`);
    }

    query = query.order("name", { ascending: true });

    if (options?.limit) {
      const from = options.offset || 0;
      const to = from + options.limit - 1;
      query = query.range(from, to);
    } else if (options?.offset) {
      query = query.range(options.offset, options.offset + 9);
    }

    const { data, error } = await query;
    if (error) this.handleError(error, "getAll");

    return (data || []).map(row => this.mapToDomain(row));
  }

  async count(options?: Pick<CategoryFilter, "type" | "parentId" | "search" | "includeDeleted">): Promise<number> {
    const supabase = await createClient();
    let query = supabase.from(this.TABLE_NAME).select("*", { count: "exact", head: true });

    if (!options?.includeDeleted) {
      query = query.is("deleted_at", null);
    }

    if (options?.type) {
      query = query.eq("type", CATEGORY_TYPES[options.type]);
    }
    if (options?.parentId !== undefined) {
      if (options.parentId === null) {
        query = query.is("parent_id", null);
      } else {
        query = query.eq("parent_id", options.parentId);
      }
    }
    if (options?.search) {
      query = query.ilike("name", `%${options.search}%`);
    }

    const { count, error } = await query;
    if (error) this.handleError(error, "count");

    return count || 0;
  }

  async getById(id: string): Promise<Category | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .select("*")
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) this.handleError(error, "getById");
    return data ? this.mapToDomain(data) : null;
  }

  async getBySlug(slug: string, type?: CategoryType): Promise<Category | null> {
    const supabase = await createClient();
    let query = supabase
      .from(this.TABLE_NAME)
      .select("*")
      .ilike("slug", slug)
      .is("deleted_at", null);
    
    if (type) {
      query = query.eq("type", CATEGORY_TYPES[type]);
    }

    const { data, error } = await query.maybeSingle();

    if (error) this.handleError(error, "getBySlug");
    return data ? this.mapToDomain(data) : null;
  }

  async create(input: CreateCategoryInput): Promise<Category> {
    const supabase = await createClient();
    const row = this.mapToRow(input) as CategoryInsert;

    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .insert(row)
      .select()
      .single();

    if (error) this.handleError(error, "create");
    return this.mapToDomain(data);
  }

  async update(input: UpdateCategoryInput): Promise<Category> {
    const supabase = await createClient();
    const row = this.mapToRow(input) as CategoryUpdate;

    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .update({
        ...row,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.id)
      .select()
      .single();

    if (error) this.handleError(error, "update");
    return this.mapToDomain(data);
  }

  async delete(id: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
      .from(this.TABLE_NAME)
      .update({
        deleted_at: new Date().toISOString(),
      } as CategoryUpdate)
      .eq("id", id);

    if (error) this.handleError(error, "delete");
  }

  async getTree(type?: CategoryType): Promise<CategoryWithChildren[]> {
    // Fetch all categories (filtered by type if provided)
    const allCategories = await this.getAll(type ? { type } : undefined);
    
    // Build tree in memory
    const categoryMap = new Map<string, CategoryWithChildren>();
    const roots: CategoryWithChildren[] = [];

    // Initialize map
    for (const cat of allCategories) {
      categoryMap.set(cat.id, { ...cat, children: [] });
    }

    // Build hierarchy
    for (const cat of allCategories) {
      const node = categoryMap.get(cat.id)!;
      if (cat.parentId) {
        const parentNode = categoryMap.get(cat.parentId);
        if (parentNode) {
          parentNode.children!.push(node);
        } else {
          // Parent not found in the current scope, push as a root (dangling node safeguard)
          roots.push(node); 
        }
      } else {
        roots.push(node);
      }
    }

    return roots;
  }

  async getChildren(parentId: string): Promise<Category[]> {
    return this.getAll({ parentId });
  }

  async getByIds(ids: string[]): Promise<Category[]> {
    if (!ids || ids.length === 0) return [];
    
    const supabase = await createClient();
    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .select("*")
      .in("id", ids)
      .is("deleted_at", null);

    if (error) this.handleError(error, "getByIds");
    return (data || []).map(row => this.mapToDomain(row));
  }

  private mapToRow(input: CreateCategoryInput | UpdateCategoryInput): Record<string, string | null | undefined> {
    const row: Record<string, string | null | undefined> = {
      name: input.name,
      slug: input.slug,
      parent_id: input.parentId !== undefined ? input.parentId : undefined,
      meta_title: "metaTitle" in input ? input.metaTitle : undefined,
      meta_description: "metaDescription" in input ? input.metaDescription : undefined,
    };

    if (input.type) {
      row.type = CATEGORY_TYPES[input.type];
    }

    return Object.fromEntries(
      Object.entries(row).filter(([_, value]) => value !== undefined)
    );
  }

  private mapToDomain(row: CategoryRow): Category {
    // Determine the type safely based on database string value
    const domainType = (Object.keys(CATEGORY_TYPES).find(
      (key) => CATEGORY_TYPES[key as CategoryType] === row.type
    ) as CategoryType) || "PRODUCT";

    return {
      id: row.id,
      name: row.name,
      slug: row.slug || "",
      parentId: row.parent_id,
      type: domainType,
      metaTitle: row.meta_title || null,
      metaDescription: row.meta_description || null,
      createdAt: row.created_at || new Date().toISOString(),
      updatedAt: row.updated_at || new Date().toISOString(),
      deletedAt: null,
    };
  }

  private handleError(error: unknown, context: string): never {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[SupabaseCategoryRepository][${context}] Error:`, error);
    throw new Error(`Database error in ${context}: ${message}`);
  }
}

export const categoryRepo = new SupabaseCategoryRepository();
