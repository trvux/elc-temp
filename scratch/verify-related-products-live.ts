import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function matches(entityName: string, title: string): boolean {
  return title.toLowerCase().includes(entityName.toLowerCase());
}

async function main() {
  const title = "Có Những Căn Phòng Bước Vào Đã Thấy Dễ Chịu – Bí Quyết Không Chỉ Nằm Ở Máy Lạnh";

  const { data: categories } = await supabase.from("categories").select("id, name, slug, group_id").is("deleted_at", null);
  const { data: groups } = await supabase.from("group_categories").select("id, name, slug").is("deleted_at", null);

  const candidates = [
    ...(categories ?? []).map((c) => ({ ...c, type: "category" as const })),
    ...(groups ?? []).map((g) => ({ ...g, type: "group" as const })),
  ];
  const matched = candidates.find((c) => matches(c.name, title));
  console.log("matched entity:", matched);

  if (matched) {
    let categoryIds: string[];
    if (matched.type === "category") {
      categoryIds = [matched.id];
    } else {
      categoryIds = (categories ?? [])
        .filter((c) => c.group_id === matched.id && !c.name.toLowerCase().includes("chưa phân loại"))
        .map((c) => c.id);
    }
    const { count } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .in("category_id", categoryIds)
      .eq("is_published", true)
      .is("deleted_at", null);
    console.log("total products in matched entity:", count);
  }
}

main().catch(console.error);
