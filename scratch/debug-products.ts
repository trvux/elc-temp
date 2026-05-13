import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkProducts() {
  const { data: cats } = await supabase.from("categories").select("*").is("deleted_at", null);
  const mayLanh = cats?.find(c => c.slug === "may-lanh");
  if (!mayLanh) return;

  const children = cats?.filter(c => c.parent_id === mayLanh.id) || [];
  const allIds = [mayLanh.id, ...children.map(c => c.id)];

  const { data: products } = await supabase
    .from("products")
    .select("id, name, category_id")
    .in("category_id", allIds)
    .limit(10);

  console.log(`--- Products in May Lanh (including children) ---`);
  console.log(`Searching for IDs: ${allIds.join(", ")}`);
  
  if (!products || products.length === 0) {
    console.log("No products found for these IDs!");
  } else {
    products.forEach(p => {
      const cat = cats?.find(c => c.id === p.category_id);
      console.log(`- [${p.id}] ${p.name} (Category: ${cat?.name || "Unknown"})`);
    });
  }
}

checkProducts();
