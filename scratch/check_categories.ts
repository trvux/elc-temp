import { createClient } from "./shared/lib/supabase/server";

async function checkCategories() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("categories").select("id, name, type, deleted_at");
  if (error) {
    console.error("Error fetching categories:", error);
    return;
  }
  console.log("Categories in DB:");
  console.table(data);
}

checkCategories();
