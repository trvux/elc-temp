import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Fixed boilerplate prefixes observed in actual category/service names — stripping
// them (as whole phrases, not per-word) leaves the genuine distinguishing phrase
// intact ("khí tươi", "âm trần", "treo tường"...) instead of shredding it into
// generic single tokens like "không" (which false-matches the negation word).
const BOILERPLATE_PREFIXES = [
  "cung cấp lắp đặt các dòng ",
  "cung cấp lắp đặt hệ thống ",
  "cung cấp lắp đặt ",
  "thu cũ đổi mới các dòng ",
  "thanh lý các dòng ",
  "vệ sinh bảo trì các dòng ",
  "cho thuê các dòng ",
  "máy ",
];

function corePhrase(name: string): string {
  let n = name.toLowerCase().trim();
  for (const prefix of BOILERPLATE_PREFIXES) {
    if (n.startsWith(prefix)) {
      n = n.slice(prefix.length);
      break;
    }
  }
  return n.trim();
}

function matches(entityName: string, title: string): boolean {
  return title.toLowerCase().includes(entityName.toLowerCase());
}

async function main() {
  const { data: groups } = await supabase.from("group_categories").select("name, slug").is("deleted_at", null);
  const { data: categories } = await supabase.from("categories").select("name, slug").is("deleted_at", null);
  const { data: services } = await supabase.from("services").select("title, slug").eq("is_published", true).is("deleted_at", null);
  const { data: news } = await supabase.from("news").select("title, slug").eq("is_published", true).is("deleted_at", null);

  const entities = [
    ...(groups ?? []).map((g) => ({ kind: "group", name: g.name, slug: g.slug })),
    ...(categories ?? []).map((c) => ({ kind: "category", name: c.name, slug: c.slug })),
    ...(services ?? []).map((s) => ({ kind: "service", name: s.title, slug: s.slug })),
  ];

  console.log("=== core phrase per entity ===");
  entities.forEach((e) => console.log(`[${e.kind}] ${e.name} -> "${corePhrase(e.name)}"`));

  console.log("\n=== match counts per entity (against 94 news titles) ===");
  entities.forEach((e) => {
    const count = (news ?? []).filter((n) => matches(e.name, n.title)).length;
    console.log(`${String(count).padStart(3)}  [${e.kind}] ${e.name}`);
  });

  console.log("\n=== sample: first 8 news titles and their matched entities ===");
  (news ?? []).slice(0, 8).forEach((n) => {
    const hit = entities.filter((e) => matches(e.name, n.title));
    console.log(`- ${n.title}\n    -> ${hit.map((h) => `[${h.kind}] ${h.name}`).join(" | ") || "(none)"}`);
  });

  const zeroMatchNews = (news ?? []).filter((n) => !entities.some((e) => matches(e.name, n.title)));
  console.log(`\nnews with 0 entity match: ${zeroMatchNews.length}/${news?.length}`);
}

main().catch(console.error);
