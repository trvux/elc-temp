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

function cleanTitle(title: string): string {
  if (!title) return title;
  
  let cleaned = title;
  
  // 1. Remove trailing "| Điện máy ELC" (with or without spaces around |)
  cleaned = cleaned.replace(/\s*\|\s*Điện máy ELC\s*$/gi, "");
  
  // 2. Remove leading "Điện máy ELC |" (with or without spaces around |)
  cleaned = cleaned.replace(/^\s*Điện máy ELC\s*\|\s*/gi, "");
  
  return cleaned.trim();
}

async function clean() {
  console.log("Starting DB meta_titles cleanup...");
  
  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .select("*");
      
    if (error) {
      console.error(`Error fetching from ${table}:`, error.message);
      continue;
    }
    
    if (!data || data.length === 0) continue;
    
    for (const row of data) {
      const oldTitle = row.meta_title;
      if (!oldTitle) continue;
      
      const newTitle = cleanTitle(oldTitle);
      if (newTitle !== oldTitle) {
        const identifier = row.name || row.title || row.slug || row.id;
        console.log(`Updating ${table} row [${identifier}]:`);
        console.log(`  From: "${oldTitle}"`);
        console.log(`  To:   "${newTitle}"`);
        
        const { error: updateError } = await supabase
          .from(table)
          .update({ meta_title: newTitle })
          .eq("id", row.id);
          
        if (updateError) {
          console.error(`  Error updating row ${row.id}:`, updateError.message);
        } else {
          console.log(`  Successfully updated!`);
        }
      }
    }
  }
  console.log("Cleanup complete!");
}

clean().catch(console.error);
