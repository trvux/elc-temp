import { createClient } from "@/shared/lib/supabase/server";
import { 
  Category, 
  CategoryType, 
  CategoryWithChildren, 
  CreateCategoryInput, 
  UpdateCategoryInput 
} from "../domain/types";
import { CategoryFilter, CategoryRepository } from "../domain/repository";

export class SupabaseCategoryRepository implements CategoryRepository {
  async getAll(options?: CategoryFilter): Promise<Category[]> {
    const supabase = await createClient();
    
    // Fetch from the new group_categories (parents) and category (children)
    // 1. Fetch Group Categories
    let groupQuery = supabase.from("group_categories" as any).select("*");
    if (!options?.includeDeleted) {
      groupQuery = groupQuery.is("deleted_at", null);
    }
    if (options?.search) {
      groupQuery = groupQuery.ilike("name", `%${options.search}%`);
    }
    const { data: groupsData, error: groupsErr } = await groupQuery;
    if (groupsErr) this.handleError(groupsErr, "getAllGroups");

    // 2. Fetch Categories
    let categoryQuery = supabase.from("categories").select("*");
    if (!options?.includeDeleted) {
      categoryQuery = categoryQuery.is("deleted_at", null);
    }
    if (options?.parentId) {
      categoryQuery = categoryQuery.eq("group_id", options.parentId);
    }
    if (options?.search) {
      categoryQuery = categoryQuery.ilike("name", `%${options.search}%`);
    }
    const { data: catsData, error: catsErr } = await categoryQuery;
    if (catsErr) this.handleError(catsErr, "getAllCategories");

    // Map Groups to Category domain model (parentId: null)
    const groups: Category[] = (groupsData as any[] || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      slug: row.slug || "",
      parentId: null,
      type: "PRODUCT",
      metaTitle: row.meta_title || null,
      metaDescription: row.meta_description || null,
      createdAt: row.created_at || new Date().toISOString(),
      updatedAt: row.updated_at || new Date().toISOString(),
      deletedAt: row.deleted_at || null,
    }));

    // Map Categories to Category domain model (parentId: group_id)
    const cats: Category[] = (catsData as any[] || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      slug: row.slug || "",
      parentId: row.group_id,
      type: "PRODUCT",
      metaTitle: row.meta_title || null,
      metaDescription: row.meta_description || null,
      createdAt: row.created_at || new Date().toISOString(),
      updatedAt: row.updated_at || new Date().toISOString(),
      deletedAt: row.deleted_at || null,
    }));

    let result = [...groups, ...cats].filter(
      (c) => !c.name.toLowerCase().includes("chưa phân loại")
    );

    // Filter in-memory if parentId is explicitly filtered
    if (options?.parentId !== undefined) {
      if (options.parentId === null) {
        result = groups;
      } else {
        result = cats.filter((c) => c.parentId === options.parentId);
      }
    }

    // Limit & Offset in-memory
    if (options?.offset) {
      result = result.slice(options.offset);
    }
    if (options?.limit) {
      result = result.slice(0, options.limit);
    }

    // Sort alphabetically by name
    return result.sort((a, b) => a.name.localeCompare(b.name));
  }

  async count(options?: Pick<CategoryFilter, "type" | "parentId" | "search" | "includeDeleted">): Promise<number> {
    const list = await this.getAll(options);
    return list.length;
  }

  async getById(id: string): Promise<Category | null> {
    const supabase = await createClient();
    
    // Check group_categories first
    const { data: group } = await supabase
      .from("group_categories" as any)
      .select("*")
      .eq("id", id)
      .maybeSingle();

    const groupRow = group as any;
    if (groupRow) {
      return {
        id: groupRow.id,
        name: groupRow.name,
        slug: groupRow.slug || "",
        parentId: null,
        type: "PRODUCT",
        metaTitle: groupRow.meta_title || null,
        metaDescription: groupRow.meta_description || null,
        createdAt: groupRow.created_at || new Date().toISOString(),
        updatedAt: groupRow.updated_at || new Date().toISOString(),
        deletedAt: groupRow.deleted_at || null,
      };
    }

    // Check category
    const { data: cat } = await supabase
      .from("categories")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    const catRow = cat as any;
    if (catRow) {
      return {
        id: catRow.id,
        name: catRow.name,
        slug: catRow.slug || "",
        parentId: catRow.group_id,
        type: "PRODUCT",
        metaTitle: catRow.meta_title || null,
        metaDescription: catRow.meta_description || null,
        createdAt: catRow.created_at || new Date().toISOString(),
        updatedAt: catRow.updated_at || new Date().toISOString(),
        deletedAt: catRow.deleted_at || null,
      };
    }

    return null;
  }

  async getBySlug(slug: string, type?: CategoryType): Promise<Category | null> {
    const supabase = await createClient();
    
    // Check group_categories first
    const { data: group } = await supabase
      .from("group_categories" as any)
      .select("*")
      .ilike("slug", slug)
      .maybeSingle();

    const groupRow = group as any;
    if (groupRow) {
      return {
        id: groupRow.id,
        name: groupRow.name,
        slug: groupRow.slug || "",
        parentId: null,
        type: "PRODUCT",
        metaTitle: groupRow.meta_title || null,
        metaDescription: groupRow.meta_description || null,
        createdAt: groupRow.created_at || new Date().toISOString(),
        updatedAt: groupRow.updated_at || new Date().toISOString(),
        deletedAt: groupRow.deleted_at || null,
      };
    }

    // Check category
    const { data: cat } = await supabase
      .from("categories")
      .select("*")
      .ilike("slug", slug)
      .maybeSingle();

    const catRow = cat as any;
    if (catRow) {
      return {
        id: catRow.id,
        name: catRow.name,
        slug: catRow.slug || "",
        parentId: catRow.group_id,
        type: "PRODUCT",
        metaTitle: catRow.meta_title || null,
        metaDescription: catRow.meta_description || null,
        createdAt: catRow.created_at || new Date().toISOString(),
        updatedAt: catRow.updated_at || new Date().toISOString(),
        deletedAt: catRow.deleted_at || null,
      };
    }

    return null;
  }

  async create(input: CreateCategoryInput): Promise<Category> {
    throw new Error("Writing is deprecated. Use category-new instead.");
  }

  async update(input: UpdateCategoryInput): Promise<Category> {
    throw new Error("Writing is deprecated. Use category-new instead.");
  }

  async delete(id: string): Promise<void> {
    throw new Error("Writing is deprecated. Use category-new instead.");
  }

  async getTree(type?: CategoryType): Promise<CategoryWithChildren[]> {
    const allCategories = await this.getAll();
    const categoryMap = new Map<string, CategoryWithChildren>();
    const roots: CategoryWithChildren[] = [];

    for (const cat of allCategories) {
      categoryMap.set(cat.id, { ...cat, children: [] });
    }

    for (const cat of allCategories) {
      const node = categoryMap.get(cat.id)!;
      if (cat.parentId) {
        const parentNode = categoryMap.get(cat.parentId);
        if (parentNode) {
          parentNode.children!.push(node);
        } else {
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
    
    // Fetch all and filter in memory
    const all = await this.getAll({ includeDeleted: true });
    return all.filter((c) => ids.includes(c.id));
  }

  private handleError(error: unknown, context: string): never {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[SupabaseCategoryRepository][${context}] Error:`, error);
    throw new Error(`Database error in ${context}: ${message}`);
  }
}

export const categoryRepo = new SupabaseCategoryRepository();
