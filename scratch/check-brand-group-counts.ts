import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
async function main() {
  const { data: brands } = await supabase.from("brands").select("id, slug").is("deleted_at", null);
  const brandRows = await Promise.all((brands ?? []).map(async (b) => {
    const { count } = await supabase.from("products").select("*", { count: "exact", head: true }).eq("brand_id", b.id).eq("is_published", true).is("deleted_at", null);
    return { slug: b.slug, count: count ?? 0 };
  }));
  console.log("=== brands ===");
  brandRows.sort((a,b)=>b.count-a.count).slice(0,10).forEach(r=>console.log(r.count, r.slug));

  const { data: groups } = await supabase.from("group_categories").select("id, slug").is("deleted_at", null);
  const groupRows = await Promise.all((groups ?? []).map(async (g) => {
    const { data: cats } = await supabase.from("categories").select("id").eq("group_id", g.id).is("deleted_at", null);
    const catIds = (cats ?? []).map(c => c.id);
    if (catIds.length === 0) return { slug: g.slug, count: 0 };
    const { count } = await supabase.from("products").select("*", { count: "exact", head: true }).in("category_id", catIds).eq("is_published", true).is("deleted_at", null);
    return { slug: g.slug, count: count ?? 0 };
  }));
  console.log("=== groups ===");
  groupRows.sort((a,b)=>b.count-a.count).forEach(r=>console.log(r.count, r.slug));
}
main().catch(console.error);
