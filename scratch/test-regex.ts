import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

function getShortTitle(title: string): string {
  // Regex to match "tại/Tại/cho/Cho" or "-" followed by the project name
  const match = title.match(/(?:tại|Tại|cho|Cho)\s+(.+)$/) || title.match(/-\s+([^-]+)$/);
  if (match && match[1]) {
    const raw = match[1].trim();
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }
  return title;
}

async function main() {
  const { data: projects, error } = await supabase
    .from("projects")
    .select("title")
    .is("deleted_at", null);

  if (error) {
    console.error("Error fetching projects:", error);
    return;
  }

  console.log(`Fetched ${projects?.length || 0} projects.\n`);
  
  projects?.forEach((p: { title: string }, idx: number) => {
    const short = getShortTitle(p.title);
    console.log(`${idx + 1}.`);
    console.log(`   [ORIGINAL]: ${p.title}`);
    console.log(`   [EXTRACTED]: ${short}`);
    console.log(`   [MATCHED]: ${short !== p.title ? "YES" : "NO"}`);
    console.log("-----------------------------------------");
  });
}

main();
