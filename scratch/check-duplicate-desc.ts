import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkGenericDescriptions() {
  const { data, error } = await supabase
    .from("products")
    .select("id, name, sku, meta_description")
    .is("deleted_at", null);

  if (error) {
    console.error("Error:", error.message);
    return;
  }

  console.log(`Total products: ${data.length}`);
  
  const genericDesc = "Máy lạnh treo tường chính hãng, tiết kiệm điện, vận hành êm ái, phù hợp nhà ở, văn phòng và cửa hàng. Tư vấn, lắp đặt chuyên nghiệp.";
  const matches = data.filter(p => p.meta_description === genericDesc);
  console.log(`Products with the exact generic description: ${matches.length}`);

  const uniqueDescriptions = new Set(data.map(p => p.meta_description));
  console.log(`Number of unique meta descriptions in DB: ${uniqueDescriptions.size}`);

  console.log("\nSample of products and descriptions:");
  data.slice(0, 10).forEach(p => {
    console.log(` - SKU: ${p.sku} | Meta Desc: ${p.meta_description ? p.meta_description.substring(0, 50) + "..." : "NULL"}`);
  });
}

checkGenericDescriptions().catch(console.error);
