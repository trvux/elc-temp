import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const { data: n } = await supabase
    .from("news")
    .select("slug, title, category_id")
    .eq("slug", "co-nhung-can-phong-buoc-vao-da-thay-de-chiu-bi-quyet-khong-chi-nam-o-may-lanh")
    .maybeSingle();
  console.log(n);

  const { count } = await supabase
    .from("news")
    .select("*", { count: "exact", head: true })
    .eq("is_published", true)
    .is("deleted_at", null)
    .not("category_id", "is", null);
  console.log("news with category_id set now:", count);
}
main().catch(console.error);
