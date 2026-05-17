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

interface TiptapNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
  text?: string;
  [key: string]: unknown;
}

async function checkProject() {
  const searchTerm = "Mr. Vĩnh";
  const { data: rows } = await supabase
    .from("projects")
    .select("id, title, description")
    .ilike("title", `%${searchTerm}%`);

  if (!rows || rows.length === 0) {
    console.log("No project found.");
    return;
  }

  const project = rows[0];
  const desc = project.description as { content?: TiptapNode[] } | null;
  if (!desc || !desc.content) {
    console.log("Description is empty.");
    return;
  }

  console.log(`Project title: ${project.title}`);
  console.log(`Total blocks in description: ${desc.content.length}`);
  
  // Get last 5 blocks
  const lastBlocks = desc.content.slice(-5);
  console.log("\nLast 5 blocks in database description:");
  console.log(JSON.stringify(lastBlocks, null, 2));
}

checkProject().catch(console.error);
