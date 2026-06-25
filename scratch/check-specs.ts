import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
  const { data, error } = await supabase
    .from("products")
    .select("name, categories(name), specs")
    .is("deleted_at", null)
    .eq("is_published", true)
    .limit(30);

  if (error) { console.error(error); return; }

  for (const p of data || []) {
    console.log(`\n[${(p.categories as any)?.name}] ${p.name}`);
    if (Array.isArray(p.specs)) {
      for (const group of p.specs as any[]) {
        console.log(`  Group: ${group.label}`);
        if (group.items) {
          for (const item of group.items) {
            console.log(`    ${item.label}: ${item.value}${item.unit ? ' ' + item.unit : ''}`);
          }
        }
      }
    }
  }
}

check().catch(console.error);
