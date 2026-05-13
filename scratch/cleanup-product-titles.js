const { createClient } = require("@supabase/supabase-js");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  console.log("Cleaning up product category titles (lowercase type)...");

  // 1. Get all categories of type product
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, type, meta_title")
    .eq("type", "product");

  if (!categories || categories.length === 0) {
    console.log("No product categories found with 'product' type");
    return;
  }

  for (const cat of categories) {
    // If it starts with "Dịch vụ", fix it
    if (cat.meta_title && cat.meta_title.startsWith("Dịch vụ")) {
      const newTitle = `${cat.name} chính hãng, giá rẻ nhất | Điện máy ELC`;
      console.log(`Fixing category: ${cat.name} -> ${newTitle}`);
      
      await supabase
        .from("categories")
        .update({ meta_title: newTitle })
        .eq("id", cat.id);
    }
  }

  console.log("Cleanup completed!");
}

run();
