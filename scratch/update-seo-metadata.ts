import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function run() {
  console.log("Updating may-lanh-treo-tuong category...");
  const { error: catError } = await supabase
    .from("categories")
    .update({
      meta_title: "Máy Lạnh Treo Tường Chính Hãng, Giá Rẻ Tại Kho",
      meta_description:
        "Mua máy lạnh treo tường (điều hòa treo tường) chính hãng Daikin, Panasonic, LG... giá rẻ tại kho. Cam kết hàng mới 100%, bảo hành uy tín, hỗ trợ lắp đặt chuyên nghiệp.",
    })
    .eq("id", "db74c68a-3e74-4cb8-8ed9-8ab439876df5");

  if (catError) {
    console.error("Failed to update categories:", catError.message);
  } else {
    console.log("Successfully updated categories meta!");
  }

  console.log("Updating may-lanh group...");
  const { error: groupError } = await supabase
    .from("group_categories")
    .update({
      meta_title: "Máy lạnh giá tốt, chính hãng, tư vấn, lắp đặt miễn phí",
      meta_description:
        "Máy lạnh chính hãng - Bảo hành tận nơi - Giá cạnh tranh, máy lạnh Daikin, máy lạnh LG, hệ thống Menred, ... - Giao hàng nhanh. Mua ngay!",
    })
    .eq("id", "0426214e-4146-4f57-8749-777b40ecb5ef");

  if (groupError) {
    console.error("Failed to update group_categories:", groupError.message);
  } else {
    console.log("Successfully updated group_categories meta!");
  }
}

run().catch(console.error);
