import { createClient } from "@/shared/lib/supabase/server";
import { createStaticClient } from "@/shared/lib/supabase/static";
import { Tables, Update } from "@/shared/types/supabase";
import { SystemPage, UpdateSystemPageInput, SystemPageRepository } from "../domain";

type SystemPageRow = Tables<"system_pages">;
type SystemPageUpdate = Update<"system_pages">;

export class SupabaseSystemPageRepository implements SystemPageRepository {
  private readonly TABLE_NAME = "system_pages";

  async getAll(): Promise<SystemPage[]> {
    const supabase = createStaticClient();
    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .select("*")
      .order("name", { ascending: true });

    if (error) this.handleError(error, "getAll");

    return (data || []).map((row) => this.mapToDomain(row));
  }

  async getBySlug(slug: string): Promise<SystemPage | null> {
    const supabase = createStaticClient();
    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (error) this.handleError(error, "getBySlug");

    return data ? this.mapToDomain(data) : null;
  }

  async update(input: UpdateSystemPageInput): Promise<SystemPage> {
    const supabase = await createClient();
    const row: SystemPageUpdate = {
      meta_title: input.metaTitle,
      meta_description: input.metaDescription,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .update(row)
      .eq("id", input.id)
      .select()
      .single();

    if (error) this.handleError(error, "update");

    return this.mapToDomain(data);
  }

  private mapToDomain(row: SystemPageRow): SystemPage {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      metaTitle: row.meta_title || null,
      metaDescription: row.meta_description || null,
      createdAt: row.created_at || new Date().toISOString(),
      updatedAt: row.updated_at || new Date().toISOString(),
    };
  }

  private handleError(error: unknown, context: string): never {
    let isAbort = false;
    if (error && typeof error === "object") {
      const errObj = error as Record<string, unknown>;
      const name = typeof errObj.name === "string" ? errObj.name : "";
      const message = typeof errObj.message === "string" ? errObj.message : "";
      if (
        name === "AbortError" || 
        message.includes("AbortError") || 
        message.includes("aborted") ||
        message.includes("operation was aborted") ||
        message.includes("prerender") ||
        message.includes("prerendering")
      ) {
        isAbort = true;
      }
    } else if (error instanceof Error) {
      if (
        error.name === "AbortError" || 
        error.message.includes("AbortError") || 
        error.message.includes("aborted") ||
        error.message.includes("operation was aborted") ||
        error.message.includes("prerender") ||
        error.message.includes("prerendering")
      ) {
        isAbort = true;
      }
    }

    if (isAbort) {
      throw error;
    }

    let message = "Unknown error";
    if (error) {
      if (typeof error === "object") {
        const errObj = error as Record<string, unknown>;
        if (typeof errObj.message === "string") {
          message = errObj.message;
          if (typeof errObj.details === "string" && errObj.details) {
            message += ` (${errObj.details})`;
          }
        }
      } else if (error instanceof Error) {
        message = error.message;
      }
    }
    console.error(`[SupabaseSystemPageRepository][${context}] Error:`, error);
    throw new Error(`Database error in ${context}: ${message}`);
  }
}

export const systemPageRepo = new SupabaseSystemPageRepository();
