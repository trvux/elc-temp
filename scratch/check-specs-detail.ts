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
    .select("name, categories(name), specs")
    .is("deleted_at", null)
    .eq("is_published", true);

  // For each category: collect unique values of key spec groups
  const catMap: Record<string, {
    total: number;
    hp: Set<string>;
    pha: Set<string>;
    inverter: Set<string>;
    gas: Set<string>;
    loaiMay: Set<string>;
  }> = {};

  for (const p of data || []) {
    const cat = (p.categories as any)?.name ?? "unknown";
    if (!catMap[cat]) catMap[cat] = { total: 0, hp: new Set(), pha: new Set(), inverter: new Set(), gas: new Set(), loaiMay: new Set() };
    catMap[cat].total++;

    // From name
    const hpMatch = p.name.match(/(\d+(?:\.\d+)?)\s*HP/i);
    if (hpMatch) catMap[cat].hp.add(hpMatch[1] + "HP");
    if (/inverter/i.test(p.name)) catMap[cat].inverter.add("Inverter");
    if (/một chiều/i.test(p.name)) catMap[cat].inverter.add("Một chiều");
    if (/hai chiều/i.test(p.name)) catMap[cat].inverter.add("Hai chiều");
    if (/1\s*pha/i.test(p.name)) catMap[cat].pha.add("1 pha");
    if (/3\s*pha/i.test(p.name)) catMap[cat].pha.add("3 pha");

    // From specs
    if (Array.isArray(p.specs)) {
      for (const group of p.specs as any[]) {
        const label = group.label?.toLowerCase() ?? "";
        if (label.includes("nguồn điện") && group.items) {
          for (const item of group.items) {
            if (String(item.value).match(/^\d+ pha$/i)) catMap[cat].pha.add(item.value);
          }
        }
        if (label.includes("loại máy") && group.value) {
          catMap[cat].loaiMay.add(group.value);
        }
        if (label.includes("gas") || label.includes("môi chất")) {
          if (group.value) catMap[cat].gas.add(group.value);
          if (group.items) group.items.forEach((i: any) => { if(i.value) catMap[cat].gas.add(i.value); });
        }
        if (label.includes("inverter")) {
          if (group.value) catMap[cat].inverter.add(group.value);
        }
      }
    }
  }

  for (const [cat, d] of Object.entries(catMap)) {
    if (!cat.includes("lạnh")) continue; // focus on máy lạnh
    console.log(`\n=== ${cat} (${d.total} sp) ===`);
    console.log("HP:", [...d.hp].sort());
    console.log("Pha:", [...d.pha]);
    console.log("Inverter/Loại:", [...d.inverter]);
    console.log("Gas:", [...d.gas]);
    console.log("Loại máy:", [...d.loaiMay]);
  }
}

check().catch(console.error);
