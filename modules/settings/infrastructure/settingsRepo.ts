import { createClient } from "@/shared/lib/supabase/server";
import { Tables } from "@/shared/types/supabase";
import { SiteSetting, SettingsRepository } from "../domain";

type SettingRow = Tables<"site_settings">;

export class SupabaseSettingsRepository implements SettingsRepository {
  async getAll(): Promise<SiteSetting[]> {
    const supabase = await createClient();
    const { data, error } = await supabase.from("site_settings").select("*");

    if (error) throw error;

    return (data || []).map((row) => this.mapToDomain(row));
  }

  async updateMany(settings: SiteSetting[]): Promise<void> {
    const supabase = await createClient();
    
    // Use upsert for many settings
    const { error } = await supabase
      .from("site_settings")
      .upsert(
        settings.map(s => ({
          key: s.key,
          value: s.value
        })),
        { onConflict: "key" }
      );

    if (error) throw error;
  }

  private mapToDomain(row: SettingRow): SiteSetting {
    return {
      key: row.key,
      value: row.value || "",
    };
  }
}

export const settingsRepo = new SupabaseSettingsRepository();
