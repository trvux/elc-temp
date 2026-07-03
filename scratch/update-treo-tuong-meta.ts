import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function run() {
  const slug = "may-lanh-treo-tuong";
  
  // 1. Fetch current info
  const { data: cat, error: fetchError } = await supabase
    .from("categories")
    .select("id, name, slug, meta_title, meta_description")
    .eq("slug", slug)
    .single();

  if (fetchError) {
    console.error("Error fetching category:", fetchError.message);
    return;
  }

  console.log("Current SEO info:");
  console.log("Meta Title:", cat.meta_title);
  console.log("Meta Description:", cat.meta_description);

  // 2. Define new values
  const newMetaTitle = "Máy lạnh treo tường chính hãng, giá rẻ";
  const newMetaDescription = "Mua máy lạnh treo tường chính hãng, giá rẻ tại Điện máy ELC. Hỗ trợ giao hàng, lắp đặt chuyên nghiệp toàn TP.HCM, bảo hành uy tín.";

  console.log("\nUpdating in DB...");
  const { error: updateError } = await supabase
    .from("categories")
    .update({
      meta_title: newMetaTitle,
      meta_description: newMetaDescription
    })
    .eq("id", cat.id);

  if (updateError) {
    console.error("Error updating category:", updateError.message);
  } else {
    console.log("Successfully updated category SEO in database!");
  }
}

run().catch(console.error);
