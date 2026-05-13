const { createClient } = require("@supabase/supabase-js");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  console.log("Removing '| Điện máy ELC' suffix from all categories in DB...");

  // Get all categories
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, meta_title");

  if (!categories || categories.length === 0) {
    console.log("No categories found");
    return;
  }

  for (const cat of categories) {
    if (cat.meta_title && cat.meta_title.includes("| Điện máy ELC")) {
      const newTitle = cat.meta_title.replace("| Điện máy ELC", "").trim();
      console.log(`Cleaning ${cat.name}: ${cat.meta_title} -> ${newTitle}`);
      
      await supabase
        .from("categories")
        .update({ meta_title: newTitle })
        .eq("id", cat.id);
    }
  }

  console.log("Cleanup of redundant suffix completed!");
}

run();
