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
    .select("name, sku, categories(name)")
    .is("deleted_at", null)
    .eq("is_published", true)
    .ilike("categories.slug", "may-lanh%");

  const catMap: Record<string, { series: Set<string>; skus: string[] }> = {};

  for (const p of data || []) {
    const cat = (p.categories as any)?.name ?? "unknown";
    if (!catMap[cat]) catMap[cat] = { series: new Set(), skus: [] };
    
    const sku = p.sku?.toUpperCase() ?? "";
    // Extract series prefix (4-5 letters before digits)
    const seriesMatch = sku.match(/^([A-Z]{3,6})\d/);
    if (seriesMatch) catMap[cat].series.add(seriesMatch[1]);
    catMap[cat].skus.push(`${p.sku} — ${p.name.slice(0, 50)}`);
  }

  for (const [cat, d] of Object.entries(catMap)) {
    console.log(`\n=== ${cat} ===`);
    console.log("Series từ SKU:", [...d.series].sort());
    console.log("Mẫu SKU:");
    d.skus.slice(0, 6).forEach(s => console.log(" ", s));
  }
}

check().catch(console.error);
