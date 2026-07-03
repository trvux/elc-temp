import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const DRY_RUN = process.argv.includes("--dry-run");

interface ProductRow {
  id: string;
  name: string;
  sku: string | null;
  meta_title: string | null;
  brands: { name: string } | null;
  categories: { name: string } | null;
}

function extractMainSku(sku?: string | null): string {
  return sku?.split(/[\/\+]/)[0].trim() || "";
}

// The old title baked "(Điều hòa)" + HP mid-string, e.g.
// "Máy lạnh tủ đứng (Điều hòa) Daikin 2HP FVA50AMVM Inverter"
// Reuse the already-correct HP token from there instead of re-deriving it
// from specs — categoryName/brandName/sku come fresh from the DB relations.
function extractHpFromOldTitle(oldTitle: string): string {
  const match = oldTitle.match(/(\d+(?:\.\d+)?\s*HP)/i);
  return match ? match[1].replace(/\s+/g, "") : "";
}

function buildNewTitle(
  brandName: string,
  mainSku: string,
  categoryName: string,
  hpValue: string,
): string {
  return `${brandName} ${mainSku} ${categoryName} ${hpValue} Inverter`
    .replace(/\s+/g, " ")
    .trim();
}

async function run() {
  console.log(`Mode: ${DRY_RUN ? "DRY RUN (no writes)" : "LIVE (will write to DB)"}`);

  const { data, error } = await supabase
    .from("products")
    .select("id,name,sku,meta_title,brands(name),categories(name)")
    .ilike("meta_title", "%(Điều hòa)%")
    .returns<ProductRow[]>();

  if (error) {
    console.error("Fetch error:", error.message);
    process.exit(1);
  }

  console.log(`Found ${data?.length ?? 0} products with the old parenthetical pattern.\n`);

  let updated = 0;
  let skipped = 0;

  for (const row of data ?? []) {
    const brandName = row.brands?.name || "";
    const categoryName = row.categories?.name || "Máy lạnh";
    const mainSku = extractMainSku(row.sku);
    const oldTitle = row.meta_title || "";
    const hpValue = extractHpFromOldTitle(oldTitle);

    if (!brandName || !mainSku) {
      console.log(`SKIP [${row.name}] — missing brand or SKU, needs manual review.`);
      skipped++;
      continue;
    }

    const newTitle = buildNewTitle(brandName, mainSku, categoryName, hpValue);

    console.log(`[${row.id}]`);
    console.log(`  From: "${oldTitle}"`);
    console.log(`  To:   "${newTitle}"`);

    if (!DRY_RUN) {
      const { error: updateError } = await supabase
        .from("products")
        .update({ meta_title: newTitle })
        .eq("id", row.id);

      if (updateError) {
        console.error(`  ERROR updating ${row.id}:`, updateError.message);
        continue;
      }
    }
    updated++;
  }

  console.log(`\nDone. ${updated} ${DRY_RUN ? "would be updated" : "updated"}, ${skipped} skipped (need manual review).`);
}

run().catch(console.error);
