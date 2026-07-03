import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
  const { data } = await supabase
    .from("products")
    .select("name, sku, description")
    .is("deleted_at", null)
    .eq("is_published", true)
    .limit(10);

  for (const p of data || []) {
    console.log(`\nName: ${p.name}`);
    console.log(`SKU: ${p.sku}`);
    if (!p.description) {
      console.log(`Description: NULL or Empty`);
    } else {
      const descStr = typeof p.description === "string" ? p.description : JSON.stringify(p.description);
      console.log(`Description Length: ${descStr.length} characters`);
      console.log(`Description Snippet: ${descStr.substring(0, 200)}...`);
    }
  }
}

check().catch(console.error);
