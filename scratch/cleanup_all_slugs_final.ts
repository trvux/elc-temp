import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

function generateSlug(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function cleanupAllTables() {
  const tableConfigs = [
    { name: "projects", textField: "title" },
    { name: "products", textField: "name" },
    { name: "services", textField: "title" },
    { name: "news", textField: "title" },
    { name: "pages", textField: "title" },
    { name: "branches", textField: "name" }
  ];
  
  for (const config of tableConfigs) {
    const table = config.name;
    const textField = config.textField;
    
    console.log(`\n--- Cleaning up table: ${table} ---`);
    
    const { data: records, error: fetchError } = await supabase
      .from(table)
      .select(`id, ${textField}, slug`);

    if (fetchError) {
      console.error(`Error fetching from ${table}:`, fetchError.message);
      continue;
    }

    let fixCount = 0;
    for (const record of records || []) {
      const textForSlug = (record as any)[textField];
      if (!textForSlug) continue;

      const currentSlug = record.slug;
      const newSlug = generateSlug(textForSlug);

      if (currentSlug !== newSlug) {
        console.log(`Fixing in ${table}: "${textForSlug}"`);
        console.log(`  From: ${currentSlug}`);
        console.log(`  To:   ${newSlug}`);

        const { error: updateError } = await supabase
          .from(table)
          .update({ slug: newSlug })
          .eq("id", record.id);

        if (updateError) {
          console.error(`  Error updating ${table} ${record.id}:`, updateError.message);
        } else {
          fixCount++;
        }
      }
    }
    console.log(`Finished ${table}. Fixed ${fixCount} records.`);
  }
}

cleanupAllTables();
