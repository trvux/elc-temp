import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const { data: groups } = await supabase
    .from("group_categories")
    .select("name, slug")
    .is("deleted_at", null);
  console.log("=== group_categories ===");
  groups?.forEach((g) => console.log(`${g.slug} | ${g.name}`));

  const { data: categories } = await supabase
    .from("categories")
    .select("name, slug")
    .is("deleted_at", null);
  console.log("\n=== categories ===");
  categories?.forEach((c) => console.log(`${c.slug} | ${c.name}`));

  const { data: services } = await supabase
    .from("services")
    .select("title, slug")
    .eq("is_published", true)
    .is("deleted_at", null);
  console.log("\n=== services ===");
  services?.forEach((s) => console.log(`${s.slug} | ${s.title}`));

  const { data: news } = await supabase
    .from("news")
    .select("title, slug")
    .eq("is_published", true)
    .is("deleted_at", null);
  console.log(`\n=== news titles (${news?.length}) ===`);
  news?.forEach((n) => console.log(n.title));
}

main().catch(console.error);
