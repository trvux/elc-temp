import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { generateJSON } from "@tiptap/html/server";
import { getTiptapExtensions } from "../shared/lib/tiptap-shared";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface FAQItem {
  question: string;
  answer: string;
}

interface SEOData {
  content: string;
  faq: FAQItem[];
}

interface DBEntity {
  id: string;
  slug: string;
  name: string;
}

async function upload() {
  console.log("Loading final SEO data...");
  const dataPath = path.join(process.cwd(), "scratch/final-seo-data.json");
  if (!fs.existsSync(dataPath)) {
    throw new Error(`SEO data file not found at ${dataPath}. Please run build-final-seo-data.ts first.`);
  }

  const fileContent = fs.readFileSync(dataPath, "utf8");
  const seoDataMap: Record<string, SEOData> = JSON.parse(fileContent);

  console.log("Fetching existing groups, categories, and brands from DB...");
  const [categoriesRes, brandsRes, groupsRes] = await Promise.all([
    supabase.from("categories").select("id, name, slug").is("deleted_at", null),
    supabase.from("brands").select("id, name, slug").is("deleted_at", null),
    supabase.from("group_categories").select("id, name, slug").is("deleted_at", null)
  ]);

  if (categoriesRes.error) throw categoriesRes.error;
  if (brandsRes.error) throw brandsRes.error;
  if (groupsRes.error) throw groupsRes.error;

  const categories: DBEntity[] = categoriesRes.data || [];
  const brands: DBEntity[] = brandsRes.data || [];
  const groups: DBEntity[] = groupsRes.data || [];

  console.log(`Loaded ${groups.length} groups, ${categories.length} categories, and ${brands.length} brands.`);

  let updatedCount = 0;

  for (const [slug, data] of Object.entries(seoDataMap)) {
    console.log(`Processing slug: ${slug}...`);

    const matchedGroup = groups.find((g) => g.slug === slug);
    const matchedCategory = categories.find((c) => c.slug === slug);
    const matchedBrand = brands.find((b) => b.slug === slug);

    let entityName = "";
    let entityType: "group" | "category" | "brand" | null = null;
    let table = "";
    let id = "";

    if (matchedGroup) {
      entityName = matchedGroup.name;
      entityType = "group";
      table = "group_categories";
      id = matchedGroup.id;
    } else if (matchedCategory) {
      entityName = matchedCategory.name;
      entityType = "category";
      table = "categories";
      id = matchedCategory.id;
    } else if (matchedBrand) {
      entityName = matchedBrand.name;
      entityType = "brand";
      table = "brands";
      id = matchedBrand.id;
    }

    if (!entityType) {
      console.warn(`  Warning: No database entity matches slug: ${slug}`);
      continue;
    }

    let htmlContent = data.content;
    if (htmlContent && !htmlContent.trim().startsWith("<h1")) {
      let title = "";
      if (entityType === "group") {
        title = `Giới thiệu dòng sản phẩm ${entityName}`;
      } else if (entityType === "category") {
        title = `Tìm hiểu về ${entityName}`;
      } else if (entityType === "brand") {
        title = `Tìm hiểu về thương hiệu ${entityName}`;
      }
      
      if (title) {
        htmlContent = `<h1>${title}</h1>\n${htmlContent}`;
      }
    }

    const tiptapJson = htmlContent ? generateJSON(htmlContent, getTiptapExtensions()) : null;

    console.log(`  Updating ${entityType}: ${entityName} (ID: ${id})`);
    const { error } = await supabase
      .from(table)
      .update({
        content: tiptapJson,
        faq: data.faq
      })
      .eq("id", id);

    if (error) {
      throw new Error(`Failed to update ${entityType} ${entityName}: ${error.message}`);
    }
    updatedCount++;
  }

  console.log(`Upload complete! Successfully updated ${updatedCount} entities in the database.`);
}

upload().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error("Upload failed:", message);
  process.exit(1);
});
