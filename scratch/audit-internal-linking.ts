import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const { count: newsCount } = await supabase
    .from("news")
    .select("*", { count: "exact", head: true })
    .eq("is_published", true)
    .is("deleted_at", null);

  const { data: newsSlugs } = await supabase
    .from("news")
    .select("slug, title, meta_description")
    .eq("is_published", true)
    .is("deleted_at", null);

  const { count: projectsPublished } = await supabase
    .from("projects")
    .select("*", { count: "exact", head: true })
    .eq("is_published", true)
    .is("deleted_at", null);

  const { data: projectsMissingMeta } = await supabase
    .from("projects")
    .select("slug, meta_title, meta_description")
    .eq("is_published", true)
    .is("deleted_at", null)
    .or("meta_title.is.null,meta_description.is.null");

  const { count: projectTypeCount } = await supabase
    .from("project_type")
    .select("*", { count: "exact", head: true })
    .is("deleted_at", null);

  const { data: projectTypesMissingMeta } = await supabase
    .from("project_type")
    .select("slug, meta_title, meta_description")
    .is("deleted_at", null)
    .or("meta_title.is.null,meta_description.is.null");

  const { count: productsPublished } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("is_published", true)
    .is("deleted_at", null);

  const { count: branchesCount } = await supabase
    .from("branches")
    .select("*", { count: "exact", head: true })
    .eq("is_published", true)
    .is("deleted_at", null);

  const { data: branchSlugs } = await supabase
    .from("branches")
    .select("slug")
    .eq("is_published", true)
    .is("deleted_at", null);

  const { count: servicesCount } = await supabase
    .from("services")
    .select("*", { count: "exact", head: true })
    .eq("is_published", true)
    .is("deleted_at", null);

  const { count: pagesCount } = await supabase
    .from("pages")
    .select("*", { count: "exact", head: true })
    .eq("is_published", true)
    .is("deleted_at", null);

  console.log("=== news ===");
  console.log("published:", newsCount);
  console.log(newsSlugs?.map((n) => `- ${n.slug} | meta_description: ${n.meta_description ? "OK" : "MISSING"}`).join("\n"));

  console.log("\n=== projects ===");
  console.log("published:", projectsPublished);
  console.log("published but missing meta_title/meta_description (EXCLUDED FROM SITEMAP):", projectsMissingMeta?.length);
  console.log(projectsMissingMeta?.map((p) => `- ${p.slug}`).join("\n"));

  console.log("\n=== project_type ===");
  console.log("total:", projectTypeCount);
  console.log("missing meta_title/meta_description (EXCLUDED FROM SITEMAP):", projectTypesMissingMeta?.length);
  console.log(projectTypesMissingMeta?.map((p) => `- ${p.slug}`).join("\n"));

  console.log("\n=== products ===");
  console.log("published:", productsPublished);

  console.log("\n=== branches ===");
  console.log("published:", branchesCount);
  console.log(branchSlugs?.map((b) => `- ${b.slug}`).join("\n"));

  console.log("\n=== services ===");
  console.log("published:", servicesCount);

  console.log("\n=== pages ===");
  console.log("published:", pagesCount);
}

main().catch(console.error);
