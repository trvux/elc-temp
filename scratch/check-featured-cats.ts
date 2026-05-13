import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFeaturedProductCategories() {
  const { data: products } = await supabase
    .from("products")
    .select("id, name, category_id, categories(name, slug, parent_id)")
    .eq("is_featured", true);

  console.log("Featured Products Category Check:");
  products?.forEach(p => {
    const cat = p.categories as any;
    console.log(`- [${p.name}]`);
    console.log(`  Current Slug: ${cat?.slug}`);
    console.log(`  Parent ID: ${cat?.parent_id ? cat.parent_id : "NULL (ROOT)"}`);
  });
}

checkFeaturedProductCategories();
