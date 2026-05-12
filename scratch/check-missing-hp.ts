import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function checkMissingHP() {
  const supabase = createClient(supabaseUrl, serviceRoleKey);
  
  const { data, error } = await supabase
    .from("products")
    .select("name, sku, slug, specs");

  if (error) {
    console.error(error);
    return;
  }

  const missing = data.filter(p => !p.slug.includes("hp"));
  
  console.log(`--- PRODUCTS WITHOUT 'HP' IN SLUG (${missing.length} items) ---`);
  missing.forEach(p => {
    console.log(`Name: ${p.name}`);
    console.log(`SKU:  ${p.sku}`);
    console.log(`Slug: ${p.slug}`);
    console.log("--------------------------------");
  });
}

checkMissingHP();
