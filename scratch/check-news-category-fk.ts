import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const { data: news } = await supabase
    .from("news")
    .select("slug, category_id")
    .eq("is_published", true)
    .is("deleted_at", null);

  const withCat = (news ?? []).filter((n) => n.category_id);
  console.log(`news with category_id set: ${withCat.length}/${news?.length}`);

  const { data: cats } = await supabase.from("categories").select("id, name").is("deleted_at", null);
  const catMap = new Map((cats ?? []).map((c) => [c.id, c.name]));
  withCat.forEach((n) => console.log(`${n.slug} -> ${catMap.get(n.category_id!) ?? n.category_id}`));
}

main().catch(console.error);
