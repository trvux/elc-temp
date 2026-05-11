import { createClient } from "../shared/lib/supabase/server.js";

async function check() {
  const supabase = await createClient();
  
  // Find the "5.5HP" product from the screenshot
  const { data: products } = await supabase
    .from("products")
    .select("name, specs, brand_id, category_id")
    .ilike("name", "%5.5HP%")
    .limit(2);
    
  if (products) {
    products.forEach(p => {
      console.log("--- Product: " + p.name + " ---");
      console.log("Specs:", JSON.stringify(p.specs, null, 2));
    });
  }
}

check();
