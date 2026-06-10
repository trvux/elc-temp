import { createClient } from "@/shared/lib/supabase/server";
import { AboutBlockRepository, AboutBlock } from "../domain";

export class SupabaseAboutBlockRepository implements AboutBlockRepository {
  private readonly TABLE_NAME = "about_blocks";

  async getAll(): Promise<AboutBlock[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .select("*")
      .order("order_index", { ascending: true });

    if (error) {
      console.error("[SupabaseAboutBlockRepository][getAll] error:", error);
      throw new Error(error.message);
    }

    return (data || []).map((row) => ({
      id: row.id,
      type: row.type,
      content: row.content,
      caption: row.caption,
      orderIndex: row.order_index,
      createdAt: row.created_at || new Date().toISOString(),
    }));
  }

  async updateAll(blocks: AboutBlock[]) {
    const supabase = await createClient();
    
    // Simple implementation: delete all and insert new
    // Or upsert. Let's use delete and insert for simplicity if it's a small set
    // But upsert is better.
    
    const { error: deleteError } = await supabase
      .from(this.TABLE_NAME)
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all

    if (deleteError) throw deleteError;

    const { error: insertError } = await supabase
      .from(this.TABLE_NAME)
      .insert(blocks.map((b, i) => ({
        id: b.id || undefined,
        type: b.type,
        content: b.content,
        caption: b.caption,
        order_index: i,
      })));

    if (insertError) throw insertError;
  }
}

export const aboutBlockRepo = new SupabaseAboutBlockRepository();
