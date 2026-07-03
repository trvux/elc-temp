import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function inspectProduct() {
  const sku = "FTKF60ZVMV / RKF60ZVMV";
  const { data: p, error } = await supabase
    .from("products")
    .select("id, name, sku, slug, is_published, deleted_at, meta_title, meta_description, description, specs")
    .ilike("sku", "%FTKF60ZVMV%")
    .single();

  if (error || !p) {
    console.error("Error fetching product:", error?.message || "Not found");
    return;
  }

  console.log("=== PRODUCT INSPECTION ===");
  console.log("ID:", p.id);
  console.log("Name:", p.name);
  console.log("SKU:", p.sku);
  console.log("Slug:", p.slug);
  console.log("Is Published:", p.is_published);
  console.log("Deleted At:", p.deleted_at);
  console.log("Meta Title in DB:", p.meta_title);
  console.log("Meta Description in DB:", p.meta_description);
  console.log("Specs (length):", Array.isArray(p.specs) ? p.specs.length : "Not array");
}

inspectProduct().catch(console.error);
