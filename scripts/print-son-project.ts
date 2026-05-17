import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Error: Missing credentials");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function printSonProject() {
  const projectId = "dc112b2b-e417-4a76-90c0-b5e38d69347d";
  const { data: row, error } = await supabase
    .from("projects")
    .select("id, title, description")
    .eq("id", projectId)
    .single();

  if (error) {
    console.error("Error:", error.message);
    return;
  }

  console.log(`TITLE: ${row.title}`);
  const content = (row.description as any)?.content || [];
  console.log(`Last 5 blocks in description:`);
  console.log(JSON.stringify(content.slice(-5), null, 2));
}

printSonProject().catch(console.error);
