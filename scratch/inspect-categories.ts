import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function run() {
  const { data: groups, error: gErr } = await supabase
    .from("group_categories")
    .select("id, name, slug, meta_title, meta_description")
    .is("deleted_at", null);

  if (gErr) throw gErr;

  console.log("=== GROUPS ===");
  console.log(JSON.stringify(groups, null, 2));

  const { data: categories, error: cErr } = await supabase
    .from("categories")
    .select("id, name, slug, group_id, meta_title, meta_description")
    .is("deleted_at", null);

  if (cErr) throw cErr;

  console.log("=== CATEGORIES ===");
  console.log(JSON.stringify(categories, null, 2));
}

run().catch(console.error);
