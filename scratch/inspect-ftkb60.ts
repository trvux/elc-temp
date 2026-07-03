import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function inspectProduct() {
  const { data: p } = await supabase
    .from("products")
    .select("id, name, sku, slug, meta_title, meta_description")
    .ilike("sku", "%FTKB60ZVMV%")
    .single();

  if (!p) {
    console.log("Not found");
    return;
  }

  console.log("=== FTKB60ZVMV INSPECTION ===");
  console.log("Name:", p.name);
  console.log("SKU:", p.sku);
  console.log("Meta Title in DB:", p.meta_title);
  console.log("Meta Description in DB:", p.meta_description);
}

inspectProduct().catch(console.error);
