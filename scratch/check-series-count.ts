import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Map series prefix → friendly name
const SERIES_LABELS: Record<string, string> = {
  // Treo tường Daikin
  FTKB: "FTKB – Phổ thông", FTKM: "FTKM – Cao cấp", FTKZ: "FTKZ – Premium",
  FTKY: "FTKY", FTKF: "FTKF", FTF: "FTF", FTXM: "FTXM", FTXV: "FTXV",
  FTHB: "FTHB – 2 chiều", FTHF: "FTHF – 2 chiều",
  // LG treo tường
  IDC: "LG", IDH: "LG", IEC: "LG", IPC: "LG",
  // Giấu trần
  FDBNQ: "Không Inverter", FDMNQ: "Không Inverter (3pha)",
  FBA: "Inverter", FBFC: "Inverter FC",
  // Âm trần
  FCNQ: "Không Inverter", FCF: "Inverter", FCFC: "Inverter FC",
  // Áp trần
  FHNQ: "Không Inverter", FHA: "Inverter", FHFC: "Inverter FC",
};

async function check() {
  const { data } = await supabase
    .from("products")
    .select("name, sku, categories(name, slug)")
    .is("deleted_at", null)
    .eq("is_published", true);

  const catMap: Record<string, Record<string, string[]>> = {};

  for (const p of data || []) {
    const cat = (p.categories as any)?.name ?? "unknown";
    const sku = (p.sku ?? "").toUpperCase();
    const m = sku.match(/^([A-Z]{3,6})\d/);
    const series = m ? m[1] : "OTHER";
    
    if (!catMap[cat]) catMap[cat] = {};
    if (!catMap[cat][series]) catMap[cat][series] = [];
    catMap[cat][series].push(p.name.slice(0, 60));
  }

  for (const [cat, seriesMap] of Object.entries(catMap)) {
    const entries = Object.entries(seriesMap).sort((a, b) => b[1].length - a[1].length);
    if (entries.length <= 1) continue;
    
    console.log(`\n▶ ${cat}`);
    for (const [series, products] of entries) {
      const label = SERIES_LABELS[series] ?? series;
      console.log(`  ${series} (${label}) → ${products.length} sp`);
      products.slice(0, 2).forEach(n => console.log(`    - ${n}`));
    }
  }
}

check().catch(console.error);
