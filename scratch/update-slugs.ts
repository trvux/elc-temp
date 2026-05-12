import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function toSlug(str: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/([^0-9a-z-\s])/g, "")
    .replace(/(\s+)/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatHP(hp: string): string {
  if (!hp) return "";
  // Parse to number to remove .0
  const num = parseFloat(hp.toString().toLowerCase().replace(/hp/g, "").trim());
  if (isNaN(num)) return hp.toString().toLowerCase().replace(/hp/g, "").replace(/[^a-z0-9]/g, "");
  
  // 1.0 -> "1", 1.5 -> "1.5" -> "15"
  return num.toString().replace(".", "").replace(",", "");
}

function cleanSku(sku: string): string {
  if (!sku) return "";
  const mainPart = sku.split(/[\/\+]/)[0].trim();
  return mainPart.toLowerCase().replace(/[^a-z0-9-]/g, "");
}

function getHPFromSpecs(specs: any, productName: string): string {
  if (!specs || !Array.isArray(specs)) {
    const nameMatch = productName.match(/(\d+(\.\d+)?)\s*HP/i);
    return nameMatch ? nameMatch[1] : "";
  }
  for (const spec of specs) {
    if (spec.label === "Công suất làm lạnh" && spec.items && Array.isArray(spec.items)) {
      const firstItem = spec.items[0];
      const valStr = firstItem?.value?.toString() || "";
      const unitStr = firstItem?.unit?.toString() || "";
      if (unitStr.toUpperCase() === "HP" || valStr.toUpperCase().includes("HP") || /^\d+(\.\d+)?\s*$/.test(valStr)) {
         const match = valStr.match(/(\d+(\.\d+)?)/);
         if (match) return match[1];
      }
    }
  }
  const nameMatch = productName.match(/(\d+(\.\d+)?)\s*HP/i);
  return nameMatch ? nameMatch[1] : "";
}

async function fixHPSlugs() {
  const supabase = createClient(supabaseUrl, serviceRoleKey);
  console.log("--- FIXING HP SLUGS (1.0 -> 1hp) ---");
  const { data: products, error } = await supabase
    .from("products")
    .select("id, name, sku, specs, brands(name)");

  if (error) return;

  const slugCounter = new Map<string, number>();

  for (const p of products) {
    const brand = toSlug((p.brands as any)?.name || "elc");
    const hp = formatHP(getHPFromSpecs(p.specs, p.name));
    const sku = cleanSku(p.sku);

    let baseSlug = brand;
    if (hp) baseSlug += `-${hp}hp`;
    if (sku) baseSlug += `-${sku}`;

    if (!baseSlug || baseSlug === brand) {
      baseSlug = toSlug(`${brand}-${p.name}`);
    }

    let finalSlug = baseSlug;
    const count = slugCounter.get(baseSlug) || 0;
    if (count > 0) {
      finalSlug = `${baseSlug}-${count}`;
    }
    slugCounter.set(baseSlug, count + 1);

    console.log(`${p.sku} -> ${finalSlug}`);
    await supabase.from("products").update({ slug: finalSlug }).eq("id", p.id);
  }
  console.log("--- DONE ---");
}

fixHPSlugs();
