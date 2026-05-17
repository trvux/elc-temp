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

interface ProjectRow {
  id: string;
  title: string;
  description: Record<string, unknown> | null;
}

async function queryProject() {
  const searchTerm = "Mr. Vĩnh";
  console.log(`Searching for projects containing: "${searchTerm}"...`);
  
  const { data: rows, error } = await supabase
    .from("projects")
    .select("id, title, description")
    .ilike("title", `%${searchTerm}%`);

  if (error) {
    console.error("Error querying project:", error.message);
    process.exit(1);
  }

  if (!rows || rows.length === 0) {
    console.log("No projects found matching the criteria.");
    process.exit(0);
  }

  for (const row of rows as unknown as ProjectRow[]) {
    console.log(`\n========================================`);
    console.log(`PROJECT ID: ${row.id}`);
    console.log(`TITLE: ${row.title}`);
    console.log(`DESCRIPTION JSON:`);
    console.log(JSON.stringify(row.description, null, 2));
    console.log(`========================================\n`);
  }
}

queryProject().catch((err) => {
  console.error("Fatal error:", err);
});
