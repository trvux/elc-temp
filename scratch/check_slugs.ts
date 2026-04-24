import { createStaticClient } from "../lib/supabase/static";

async function checkCategories() {
  const supabase = createStaticClient();
  const { data, error } = await supabase.from("categories").select("slug").limit(10);
  if (error) {
    console.error(error);
    return;
  }
  console.log(JSON.stringify(data, null, 2));
}

checkCategories();
