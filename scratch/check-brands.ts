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
    .select("category_id, brand_id, categories(name), brands(name)")
    .is("deleted_at", null)
    .eq("is_published", true);

  if (error) { console.error(error); return; }

  const map: Record<string, Set<string>> = {};
  for (const p of data || []) {
    const cat = (p.categories as any)?.name ?? p.category_id;
    const brand = (p.brands as any)?.name ?? p.brand_id;
    if (!map[cat]) map[cat] = new Set();
    map[cat].add(brand);
  }

  for (const [cat, brands] of Object.entries(map)) {
    console.log(`\n${cat} (${brands.size} brands): ${[...brands].join(", ")}`);
  }
}

check().catch(console.error);
