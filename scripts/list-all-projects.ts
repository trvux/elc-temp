import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Error: Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function listProjects() {
  const { data: rows, error } = await supabase
    .from("projects")
    .select("id, title, is_published, deleted_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error listing projects:", error.message);
    process.exit(1);
  }

  console.log(`Found ${rows?.length} projects:`);
  for (const row of rows || []) {
    console.log(`- ID: ${row.id} | Title: "${row.title}" | Published: ${row.is_published} | Deleted: ${!!row.deleted_at}`);
  }
}

listProjects().catch(console.error);
