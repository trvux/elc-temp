import { createClient } from "../shared/lib/supabase/server.js";

async function check() {
  const supabase = await createClient();
  
  // Find LG 1HP products
  const { data: products } = await supabase
    .from("products")
    .select("name, specs")
    .ilike("name", "%LG%1HP%")
    .limit(5);
    
  if (products) {
    products.forEach(p => {
      console.log("--- " + p.name + " ---");
      console.log("Specs:", JSON.stringify(p.specs, null, 2));
    });
  }
}

check();
