import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkCategories() {
  const { data: cats, error } = await supabase
    .from("categories")
    .select("id, name, slug, parent_id, type")
    .is("deleted_at", null);

  if (error) {
    console.error(error);
    return;
  }

  console.log("--- All Categories ---");
  cats.forEach(c => {
    console.log(`[${c.id}] ${c.name} (slug: ${c.slug}, parent: ${c.parent_id}, type: ${c.type})`);
  });

  const mayLanh = cats.find(c => c.slug === "may-lanh");
  if (mayLanh) {
    console.log("\n--- Children of May Lanh ---");
    const children = cats.filter(c => c.parent_id === mayLanh.id);
    children.forEach(c => {
      console.log(`- ${c.name} (${c.id})`);
    });
  } else {
    console.log("\n!!! Category 'may-lanh' not found by slug 'may-lanh'");
  }
}

checkCategories();
