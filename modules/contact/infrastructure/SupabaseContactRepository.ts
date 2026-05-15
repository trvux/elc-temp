import { createClient } from "@/shared/lib/supabase/server";
import { Tables, Insert, Update } from "@/shared/types/supabase";
import {
  CreateContactInput,
  Contact,
  ContactFilter,
  ContactRepository,
  UpdateContactInput,
  mapContactRowToDomain,
} from "../domain";

type ContactRow = Tables<"contacts">;
type ContactInsert = Insert<"contacts">;
type ContactUpdate = Update<"contacts">;

export class SupabaseContactRepository implements ContactRepository {
  private readonly TABLE_NAME = "contacts";

  async getAll(options?: ContactFilter): Promise<Contact[]> {
    const supabase = await createClient();
    let query = supabase.from(this.TABLE_NAME).select("*");

    if (options?.type && options.type !== "all") {
      query = query.eq("type", options.type);
    }

    if (options?.search) {
      query = query.or(`label.ilike.%${options.search}%,value.ilike.%${options.search}%`);
    }

    query = query.order("order_index", { ascending: true });

    const { data, error } = await query;

    if (error) this.handleError(error, "getAll");

    return (data || []).map((row) => this.mapToDomain(row));
  }

  async count(options?: ContactFilter): Promise<number> {
    const supabase = await createClient();
    let query = supabase
      .from(this.TABLE_NAME)
      .select("*", { count: "exact", head: true });

    if (options?.type && options.type !== "all") {
      query = query.eq("type", options.type);
    }

    const { count, error } = await query;
    if (error) this.handleError(error, "count");

    return count || 0;
  }

  async getById(id: string): Promise<Contact | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) this.handleError(error, "getById");

    return data ? this.mapToDomain(data) : null;
  }

  async create(input: CreateContactInput): Promise<Contact> {
    const supabase = await createClient();
    const row: ContactInsert = {
      type: input.type,
      label: input.label || null,
      value: input.value,
      is_active: input.isActive ?? true,
      order_index: input.orderIndex ?? 0,
    };

    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .insert(row)
      .select()
      .single();

    if (error) this.handleError(error, "create");

    return this.mapToDomain(data);
  }

  async update(input: UpdateContactInput): Promise<Contact> {
    const supabase = await createClient();
    const row: ContactUpdate = {
      type: input.type,
      label: input.label,
      value: input.value,
      is_active: input.isActive,
      order_index: input.orderIndex,
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

  async delete(id: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
      .from(this.TABLE_NAME)
      .delete()
      .eq("id", id);

    if (error) this.handleError(error, "delete");
  }

  private mapToDomain(row: ContactRow): Contact {
    return mapContactRowToDomain(row);
  }

  private handleError(error: unknown, context: string): never {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[SupabaseContactRepository][${context}] Error:`, error);
    throw new Error(`Database error in ${context}: ${message}`);
  }
}

export const contactRepo = new SupabaseContactRepository();
