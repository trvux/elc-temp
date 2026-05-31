import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://gdzihzsjfczuggwpykjk.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkemloenNqZmN6dWdnd3B5a2prIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0NjIwNTIsImV4cCI6MjA5MTAzODA1Mn0.rNlkqc8ps98zfgcVHugFavaBdejQYgP24Us3l8dJLNs"
);

async function main() {
  const { data: groups } = await supabase
    .from("group_categories")
    .select("id, name, slug")
    .is("deleted_at", null)
    .order("name", { ascending: true });

  const { data: cats } = await supabase
    .from("categories")
    .select("id, name, slug, group_id")
    .is("deleted_at", null)
    .order("name", { ascending: true });

  console.log("=== GROUP CATEGORIES ===");
  (groups || []).forEach((g) => {
    console.log(`  [${g.id}] ${g.name} (slug: ${g.slug})`);
    const children = (cats || []).filter((c) => c.group_id === g.id);
    children.forEach((c) => {
      console.log(`      -> ${c.name} (slug: ${c.slug})`);
    });
  });

  const unlinked = (cats || []).filter((c) => !c.group_id);
  if (unlinked.length) {
    console.log("\n=== UNLINKED CATEGORIES (no group_id) ===");
    unlinked.forEach((c) => console.log(`  ${c.name}`));
  }
}

main().catch(console.error);
