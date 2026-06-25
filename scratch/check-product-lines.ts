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
    .select("name, sku, categories(name), brands(name), specs")
    .is("deleted_at", null)
    .eq("is_published", true)
    .order("name");

  // Group by category, extract HP/công suất from specs or name
  const catMap: Record<string, { names: string[]; hpValues: Set<string>; skus: string[] }> = {};

  for (const p of data || []) {
    const cat = (p.categories as any)?.name ?? "unknown";
    if (!catMap[cat]) catMap[cat] = { names: [], hpValues: new Set(), skus: [] };
    catMap[cat].names.push(p.name);
    catMap[cat].skus.push(p.sku);

    // Extract HP from specs
    if (Array.isArray(p.specs)) {
      for (const group of p.specs as any[]) {
        if (group.label?.includes("Công suất") && group.items) {
          for (const item of group.items) {
            if (item.unit === "Hp" || item.unit === "HP" || String(item.value).includes("HP") || String(item.value).includes("Hp")) {
              catMap[cat].hpValues.add(`${item.value} ${item.unit || "HP"}`.trim());
            }
          }
        }
      }
    }
    // Extract HP from name
    const hpMatch = p.name.match(/(\d+(?:\.\d+)?)\s*HP/i);
    if (hpMatch) catMap[cat].hpValues.add(hpMatch[0]);
  }

  for (const [cat, data] of Object.entries(catMap)) {
    console.log(`\n=== ${cat} (${data.names.length} sản phẩm) ===`);
    console.log("HP values:", [...data.hpValues].sort());
    console.log("Sample names:");
    data.names.slice(0, 5).forEach(n => console.log(" -", n));
  }
}

check().catch(console.error);
