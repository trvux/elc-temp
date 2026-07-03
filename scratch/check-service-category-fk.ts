import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const { data: services, error } = await supabase
    .from("services")
    .select("title, slug, category_id, group_id")
    .eq("is_published", true)
    .is("deleted_at", null);
  if (error) return console.error(error.message);

  const catIds = [...new Set((services ?? []).map((s) => s.category_id).filter(Boolean))];
  const { data: cats } = await supabase.from("categories").select("id, name").in("id", catIds.length ? catIds : ["-"]);
  const catMap = new Map((cats ?? []).map((c) => [c.id, c.name]));

  services?.forEach((s) =>
    console.log(`${s.slug} | category_id=${s.category_id ?? "NULL"} (${s.category_id ? catMap.get(s.category_id) : "-"}) | group_id=${s.group_id ?? "NULL"}`)
  );
}

main().catch(console.error);
