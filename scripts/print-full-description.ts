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

async function printFullProjectDescription() {
  const projectId = "ac0ec2fd-1b74-4fb4-80ed-b0e41fbd78cb";
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
  console.log(`DESCRIPTION JSON:`);
  console.log(JSON.stringify(row.description, null, 2));
}

printFullProjectDescription().catch(console.error);
