import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function extractHP(name: string): string | null {
  const m = name.match(/(\d+(?:\.\d+)?)\s*HP/i);
  return m ? m[1] + "HP" : null;
}

function extractSeries(sku: string): string | null {
  const s = sku.toUpperCase();
  const m = s.match(/^([A-Z]{3,6})\d/);
  return m ? m[1] : null;
}

function extractPha(name: string, specs: any[]): string | null {
  if (/3\s*pha/i.test(name)) return "3 pha";
  if (/1\s*pha/i.test(name)) return "1 pha";
  for (const g of specs) {
    if (g.label?.toLowerCase().includes("nguồn điện") && g.items) {
      for (const item of g.items) {
        if (/^\d+ pha$/i.test(String(item.value ?? ""))) return item.value;
      }
    }
  }
  return null;
}

function extractInverter(name: string, specs: any[]): string | null {
  for (const g of specs) {
    if (g.label?.toLowerCase().includes("loại máy") && g.value) {
      const v = g.value.toLowerCase();
      if (v.includes("không inverter")) return "Không Inverter";
      if (v.includes("inverter")) return "Inverter";
    }
  }
  if (/không inverter/i.test(name)) return "Không Inverter";
  if (/inverter/i.test(name)) return "Inverter";
  return null;
}

function extractLoai(name: string, specs: any[]): string | null {
  for (const g of specs) {
    if (g.label?.toLowerCase().includes("loại máy") && g.value) {
      const v = g.value.toLowerCase();
      if (v.includes("2 chiều") || v.includes("hai chiều") || v.includes("lạnh / sưởi")) return "2 chiều (lạnh+sưởi)";
      if (v.includes("1 chiều") || v.includes("một chiều")) return "1 chiều (chỉ lạnh)";
    }
  }
  if (/hai chiều/i.test(name)) return "2 chiều (lạnh+sưởi)";
  if (/một chiều/i.test(name)) return "1 chiều (chỉ lạnh)";
  return null;
}

async function check() {
  const { data } = await supabase
    .from("products")
    .select("name, sku, categories(name), specs")
    .is("deleted_at", null)
    .eq("is_published", true);

  const catMap: Record<string, {
    total: number;
    hp: Set<string>;
    series: Set<string>;
    pha: Set<string>;
    inverter: Set<string>;
    loai: Set<string>;
  }> = {};

  for (const p of data || []) {
    const cat = (p.categories as any)?.name ?? "unknown";
    if (!catMap[cat]) catMap[cat] = { total: 0, hp: new Set(), series: new Set(), pha: new Set(), inverter: new Set(), loai: new Set() };
    catMap[cat].total++;

    const specs = Array.isArray(p.specs) ? p.specs as any[] : [];

    const hp = extractHP(p.name);
    if (hp) catMap[cat].hp.add(hp);

    const series = extractSeries(p.sku ?? "");
    if (series) catMap[cat].series.add(series);

    const pha = extractPha(p.name, specs);
    if (pha) catMap[cat].pha.add(pha);

    const inv = extractInverter(p.name, specs);
    if (inv) catMap[cat].inverter.add(inv);

    const loai = extractLoai(p.name, specs);
    if (loai) catMap[cat].loai.add(loai);
  }

  console.log("\n=== KẾT QUẢ: Các chiều lọc khả dụng (ngoài HP) ===\n");

  for (const [cat, d] of Object.entries(catMap)) {
    if (d.total < 3) continue;
    console.log(`▶ ${cat} (${d.total} sp)`);
    
    const usable: string[] = [];
    const chips: Record<string, string[]> = {};

    // HP
    const hpSorted = [...d.hp].sort((a, b) => parseFloat(a) - parseFloat(b));
    chips["HP"] = hpSorted;
    if (hpSorted.length > 1) usable.push(`HP (${hpSorted.length} giá trị)`);

    // Dòng/Series
    const series = [...d.series].sort();
    chips["Dòng (SKU)"] = series;
    if (series.length > 1) usable.push(`Dòng/Series (${series.join(", ")})`);

    // Pha
    const pha = [...d.pha];
    chips["Pha"] = pha;
    if (pha.length > 1) usable.push(`Pha (${pha.join(" / ")})`);

    // Inverter
    const inv = [...d.inverter];
    chips["Inverter"] = inv;
    if (inv.length > 1) usable.push(`Inverter (${inv.join(" / ")})`);

    // Loại
    const loai = [...d.loai];
    chips["Loại"] = loai;
    if (loai.length > 1) usable.push(`Loại chiều (${loai.join(" / ")})`);

    if (usable.length === 0) {
      console.log("  ❌ Không có chiều lọc có ý nghĩa (chỉ 1 giá trị mỗi dim)");
    } else {
      usable.forEach(u => console.log(`  ✅ ${u}`));
    }

    // Show chip values detail
    console.log("  --- Chi tiết ---");
    for (const [k, v] of Object.entries(chips)) {
      if (v.length > 0) console.log(`  ${k}: [${v.join(", ")}]`);
    }
    console.log();
  }
}

check().catch(console.error);
