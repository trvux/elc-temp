import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function run() {
  const { data: cat, error } = await supabase
    .from("categories")
    .select("id, name, slug, content, meta_title, meta_description")
    .eq("slug", "may-lanh-treo-tuong")
    .single();

  if (error) {
    console.error("Error:", error.message);
  } else {
    console.log("Category info in DB:");
    console.log("ID:", cat.id);
    console.log("Name:", cat.name);
    console.log("Meta Title:", cat.meta_title);
    console.log("Meta Description:", cat.meta_description);
    console.log("Content:", JSON.stringify(cat.content, null, 2));
  }
}

run().catch(console.error);
