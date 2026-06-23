import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function inspect() {
  console.log("Scanning catalog entities...");

  const [categoriesRes, brandsRes, groupsRes] = await Promise.all([
    supabase.from("categories").select("id, name, slug").is("deleted_at", null),
    supabase.from("brands").select("id, name, slug").is("deleted_at", null),
    supabase.from("group_categories").select("id, name, slug").is("deleted_at", null)
  ]);

  console.log("\n=== CATEGORIES ===");
  console.log(categoriesRes.data || []);

  console.log("\n=== BRANDS ===");
  console.log(brandsRes.data || []);

  console.log("\n=== GROUPS ===");
  console.log(groupsRes.data || []);
}

inspect().catch(console.error);
