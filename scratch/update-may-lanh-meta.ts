import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function run() {
  // 1. Fetch current may-lanh group category
  const { data: group, error: fetchError } = await supabase
    .from("group_categories")
    .select("*")
    .eq("slug", "may-lanh")
    .single();

  if (fetchError) {
    console.error("Error fetching group category:", fetchError.message);
    return;
  }

  console.log("Current May Lanh Group Category SEO:");
  console.log("ID:", group.id);
  console.log("Name:", group.name);
  console.log("Meta Title:", group.meta_title);
  console.log("Meta Description:", group.meta_description);

  // 2. Define the new meta title
  const newMetaTitle = "Máy lạnh chính hãng, giá rẻ tại kho";
  
  console.log(`\nUpdating Meta Title to: "${newMetaTitle}"...`);
  
  // 3. Update the row in DB
  const { error: updateError } = await supabase
    .from("group_categories")
    .update({
      meta_title: newMetaTitle
    })
    .eq("id", group.id);

  if (updateError) {
    console.error("Error updating group category:", updateError.message);
  } else {
    console.log("Successfully updated group category meta title in database!");
  }
}

run().catch(console.error);
