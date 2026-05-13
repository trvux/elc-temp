import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProductCategories() {
  const { data: products } = await supabase
    .from("products")
    .select("id, name, category_id, categories(name, parent_id)")
    .limit(100);

  console.log("Product Category Sample:");
  products?.forEach(p => {
    const cat = p.categories as any;
    console.log(`- [${p.name}] Category: ${cat?.name} (Parent ID: ${cat?.parent_id ? "HAS PARENT" : "NO PARENT - THIS IS A ROOT"})`);
  });
}

checkProductCategories();
