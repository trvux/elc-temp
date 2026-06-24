import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const tables = [
  "branches",
  "brands",
  "categories",
  "group_categories",
  "news",
  "old_services",
  "pages",
  "products",
  "project_type",
  "projects",
  "service_groups",
  "services",
  "system_pages"
];

async function run() {
  console.log("Searching all tables for 'Điện máy ELC' in meta_title...");
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select("*");
    if (error) {
      console.error(`Error querying ${table}:`, error.message);
      continue;
    }
    if (!data) continue;
    for (const row of data) {
      const title = row.meta_title;
      if (title && title.toLowerCase().includes("điện máy elc")) {
        console.log(`Table: ${table}, ID: ${row.id}, Identifier: ${row.name || row.title || row.slug || row.id}`);
        console.log(`  meta_title: "${title}"`);
      }
    }
  }
}

run().catch(console.error);
