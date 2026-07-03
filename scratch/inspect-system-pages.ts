import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function inspect() {
  // Check system_pages table
  const { data, error } = await supabase
    .from("system_pages")
    .select("*")
    .limit(20);

  if (error) {
    console.log("No system_pages table or error:", error.message);
  } else {
    console.log("system_pages:", JSON.stringify(data, null, 2));
  }

  // Check navigation or menu tables
  const tables = ["menus", "navigation", "nav_items", "menu_items", "links"];
  for (const t of tables) {
    const { data: d, error: e } = await supabase.from(t).select("*").limit(5);
    if (!e && d) {
      console.log(`\nTable ${t}:`, JSON.stringify(d, null, 2));
    }
  }
}

inspect().catch(console.error);
