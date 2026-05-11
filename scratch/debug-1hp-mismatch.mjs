import { createClient } from "../shared/lib/supabase/server.js";

async function check() {
  const supabase = await createClient();
  
  // Find "2HP" products in "Áp trần" category
  const { data: products } = await supabase
    .from("products")
    .select("name, specs, brand_id, category_id")
    .ilike("name", "%áp trần%2HP%")
    .limit(1);
    
  if (products && products[0]) {
    const p = products[0];
    console.log("Product Name:", p.name);
    console.log("Product Specs:", JSON.stringify(p.specs, null, 2));
    
    // Test the logic from searchProducts.ts
    function getCapacityFromText(text) {
      const l = text.toLowerCase();
      const hpMatch = l.match(/(\d+(\.\d+)?)\s*hp/);
      if (hpMatch) {
        const numeric = parseFloat(hpMatch[1]);
        if (numeric <= 1.2) return "9.000 BTU (1 HP)";
        if (numeric <= 1.7) return "12.000 BTU (1.5 HP)";
        if (numeric <= 2.2) return "18.000 BTU (2 HP)";
        return "Other";
      }
      return null;
    }
    
    console.log("Extraction from Name:", getCapacityFromText(p.name));
  }
}

check();
