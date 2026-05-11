import { createClient } from "./shared/lib/supabase/server.js";

async function check() {
  const supabase = await createClient();
  
  const { data: cat } = await supabase
    .from("categories")
    .select("*")
    .ilike("name", "%áp trần%")
    .single();
    
  console.log("Category:", cat);
  
  if (cat) {
    const { data: products } = await supabase
      .from("products")
      .select("name, specs")
      .eq("category_id", cat.id);
      
    console.log("Products count:", products?.length);
    
    const capacities = new Set();
    products?.forEach(p => {
      // Check name for HP
      const hpMatch = p.name.match(/(\d+(\.\d+)?)\s*HP/i);
      if (hpMatch) capacities.add(hpMatch[0].toUpperCase());
      
      // Check specs
      if (Array.isArray(p.specs)) {
        p.specs.forEach(s => {
          if (s.label?.toLowerCase() === "công suất") {
             capacities.add(s.value);
          }
        });
      }
    });
    
    console.log("Found capacities:", Array.from(capacities));
  }
}

check();
