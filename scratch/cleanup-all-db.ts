import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const schema = [
  {
    table: "branches",
    columns: ["address", "email", "image_url", "maps_embed", "maps_url", "meta_description", "meta_title", "name", "phone", "slug"]
  },
  {
    table: "brands",
    columns: ["logo_url", "meta_description", "meta_title", "name", "slug"]
  },
  {
    table: "categories",
    columns: ["image_url", "meta_description", "meta_title", "name", "slug"]
  },
  {
    table: "group_categories",
    columns: ["image_url", "meta_description", "meta_title", "name", "slug"]
  },
  {
    table: "news",
    columns: ["image", "meta_description", "meta_title", "slug", "title"]
  },
  {
    table: "old_services",
    columns: ["image", "meta_description", "meta_title", "slug", "title"]
  },
  {
    table: "pages",
    columns: ["meta_description", "meta_title", "slug", "title"]
  },
  {
    table: "products",
    columns: ["gtin", "meta_description", "meta_title", "mpn", "name", "sku", "slug", "stock_status"]
  },
  {
    table: "project_type",
    columns: ["image", "meta_description", "meta_title", "name", "slug"]
  },
  {
    table: "projects",
    columns: ["meta_description", "meta_title", "slug", "title"]
  },
  {
    table: "service_groups",
    columns: ["image_url", "meta_description", "meta_title", "name", "slug"]
  },
  {
    table: "services",
    columns: ["description", "image", "meta_description", "meta_title", "price_display_text", "slug", "title"]
  },
  {
    table: "system_pages",
    columns: ["meta_description", "meta_title", "name", "slug"]
  },
  {
    table: "site_settings",
    columns: ["key", "value"]
  }
];

function cleanValue(val: string): string {
  if (!val || typeof val !== "string") return val;
  
  let cleaned = val;
  
  // Replace:
  // 1. " | Điện máy ELC" at the end of the string
  cleaned = cleaned.replace(/\s*\|\s*Điện máy ELC\s*$/gi, "");
  
  // 2. "Điện máy ELC | " at the start of the string
  cleaned = cleaned.replace(/^\s*Điện máy ELC\s*\|\s*/gi, "");
  
  // 3. " | Điện máy ELC | " in the middle of the string -> replaces with " |"
  cleaned = cleaned.replace(/\s*\|\s*Điện máy ELC\s*\|/gi, " |");
  
  // 4. Any remaining "| Điện máy ELC" or "Điện máy ELC |"
  cleaned = cleaned.replace(/\s*\|\s*Điện máy ELC/gi, "");
  cleaned = cleaned.replace(/Điện máy ELC\s*\|\s*/gi, "");
  
  return cleaned.trim();
}

async function run() {
  console.log("Starting comprehensive DB cleanup for 'Điện máy ELC' with pipe...");
  
  for (const entry of schema) {
    const { table, columns } = entry;
    
    const { data, error } = await supabase.from(table).select("*");
    if (error) {
      console.error(`Error querying table ${table}:`, error.message);
      continue;
    }
    
    if (!data || data.length === 0) continue;
    
    for (const row of data) {
      const updates: Record<string, any> = {};
      let hasChanges = false;
      
      for (const col of columns) {
        const val = row[col];
        if (val && typeof val === "string") {
          const cleaned = cleanValue(val);
          if (cleaned !== val) {
            updates[col] = cleaned;
            hasChanges = true;
            
            const identifier = row.name || row.title || row.slug || row.id || row.key;
            console.log(`[Change Detected] Table: ${table}, Row: ${identifier}, Column: ${col}`);
            console.log(`  Old: "${val}"`);
            console.log(`  New: "${cleaned}"`);
          }
        }
      }
      
      if (hasChanges) {
        // Build the update query. Primary keys:
        // For site_settings it's 'key', for others it's 'id'
        const query = supabase.from(table).update(updates);
        if (table === "site_settings") {
          query.eq("key", row.key);
        } else {
          query.eq("id", row.id);
        }
        
        const { error: updateError } = await query;
        if (updateError) {
          console.error(`  Error updating row:`, updateError.message);
        } else {
          console.log(`  Successfully updated database row!`);
        }
      }
    }
  }
  
  console.log("Comprehensive cleanup complete!");
}

run().catch(console.error);
