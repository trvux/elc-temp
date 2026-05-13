const { createClient } = require("@supabase/supabase-js");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  console.log("Standardizing 'Điện máy' (lowercase m) in DB...");

  // 1. Update categories
  const { data: categories } = await supabase
    .from("categories")
    .select("id, meta_title, meta_description")
    .or("meta_title.ilike.%Điện Máy%,meta_description.ilike.%Điện Máy%");

  if (categories && categories.length > 0) {
    for (const cat of categories) {
      const newTitle = cat.meta_title ? cat.meta_title.replace(/Điện Máy/g, "Điện máy") : null;
      const newDesc = cat.meta_description ? cat.meta_description.replace(/Điện Máy/g, "Điện máy") : null;
      
      console.log(`Updating category ID: ${cat.id}`);
      await supabase
        .from("categories")
        .update({ 
          meta_title: newTitle,
          meta_description: newDesc
        })
        .eq("id", cat.id);
    }
  }

  // 2. Update products (meta_description)
  const { data: products } = await supabase
    .from("products")
    .select("id, meta_description")
    .ilike("meta_description", "%Điện Máy%");

  if (products && products.length > 0) {
    for (const prod of products) {
      const newDesc = prod.meta_description ? prod.meta_description.replace(/Điện Máy/g, "Điện máy") : null;
      console.log(`Updating product ID: ${prod.id}`);
      await supabase
        .from("products")
        .update({ meta_description: newDesc })
        .eq("id", prod.id);
    }
  }

  console.log("DB Standardization completed!");
}

run();
