import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function run() {
  // Query to find all tables with meta_title or similar columns
  const { data: columns, error: colError } = await supabase.rpc("execute_sql", {
    query_text: `
      SELECT table_name, column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND (column_name ILIKE '%meta_title%' OR column_name ILIKE '%metatitle%' OR column_name ILIKE '%seo_title%')
      ORDER BY table_name;
    `
  });

  if (colError) {
    // If rpc("execute_sql") is not defined or fails, we can try querying using raw postgres client or we can inspect database.types.ts or try checking standard tables.
    console.error("RPC execute_sql failed, trying list of known tables from database.types.ts:", colError.message);
    
    // We can also list standard tables with meta_title based on database.types.ts
    // Let's print out if it failed.
    return;
  }

  console.log("Found columns:", JSON.stringify(columns, null, 2));
}

run().catch(console.error);
