import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug")
    .is("deleted_at", null);

  const rows = await Promise.all(
    (categories ?? []).map(async (c) => {
      const { count } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("category_id", c.id)
        .eq("is_published", true)
        .is("deleted_at", null);
      return { slug: c.slug, name: c.name, count: count ?? 0 };
    })
  );

  rows
    .sort((a, b) => b.count - a.count)
    .forEach((r) => console.log(`${String(r.count).padStart(4)}  ${r.slug}`));

  console.log("\nmax:", Math.max(...rows.map((r) => r.count)));
}

main().catch(console.error);
