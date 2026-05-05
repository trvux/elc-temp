import { createClient } from "@/shared/lib/supabase/server";
import { Tables } from "@/shared/types/supabase";
import { Contact, CreateContactInput, UpdateContactInput } from "../domain/types";

type ContactRow = Tables<"contacts">;

export const contactRepo = {
  async getAll(): Promise<Contact[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("contacts")
      .select("*")
      .order("order_index", { ascending: true });

    if (error) throw error;

    return (data || []).map((row) => this.mapToDomain(row));
  },

  async create(input: CreateContactInput): Promise<Contact> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("contacts")
      .insert({
        type: input.type,
        label: input.label,
        value: input.value,
        order_index: input.orderIndex,
      })
      .select()
      .single();

    if (error) throw error;

    return this.mapToDomain(data);
  },

  async update(input: UpdateContactInput): Promise<Contact> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("contacts")
      .update({
        type: input.type,
        label: input.label,
        value: input.value,
        order_index: input.orderIndex,
      })
      .eq("id", input.id)
      .select()
      .single();

    if (error) throw error;

    return this.mapToDomain(data);
  },

  async delete(id: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase.from("contacts").delete().eq("id", id);

    if (error) throw error;
  },

  mapToDomain(row: ContactRow): Contact {
    return {
      id: row.id,
      type: row.type,
      label: row.label || "",
      value: row.value,
      orderIndex: row.order_index || 0,
    };
  }
};
