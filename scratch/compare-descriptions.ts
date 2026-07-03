import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkDuplicates() {
  const { data: p1 } = await supabase
    .from("products")
    .select("name, description")
    .ilike("sku", "%FTKF60ZVMV%")
    .single();

  const { data: p2 } = await supabase
    .from("products")
    .select("name, description")
    .ilike("sku", "%FTKB60ZVMV%")
    .single();

  if (!p1 || !p2) {
    console.log("Failed to fetch one of the products.");
    return;
  }

  const d1 = typeof p1.description === "string" ? p1.description : JSON.stringify(p1.description);
  const d2 = typeof p2.description === "string" ? p2.description : JSON.stringify(p2.description);

  console.log(`Product 1: ${p1.name}`);
  console.log(`Product 2: ${p2.name}`);
  console.log(`P1 description length: ${d1.length}`);
  console.log(`P2 description length: ${d2.length}`);

  if (d1 === d2) {
    console.log("\nWARNING: Both products have the EXACT same description in the database!");
  } else {
    console.log("\nDescriptions are different.");
    // Print first 500 characters of both to compare
    console.log("\nP1 snippet:", d1.substring(0, 300));
    console.log("\nP2 snippet:", d2.substring(0, 300));
  }
}

checkDuplicates().catch(console.error);
