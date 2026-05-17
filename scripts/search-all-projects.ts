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

function searchNodeForText(node: TiptapNode, query: string, path: string = "root"): Array<{ path: string; text: string; node: TiptapNode }> {
  const results: Array<{ path: string; text: string; node: TiptapNode }> = [];
  
  if (node.text && node.text.toLowerCase().includes(query.toLowerCase())) {
    results.push({ path, text: node.text, node });
  }
  
  if (node.content) {
    node.content.forEach((child, index) => {
      results.push(...searchNodeForText(child, query, `${path} -> ${node.type}[${index}]`));
    });
  }
  
  return results;
}

async function searchAllProjects() {
  const { data: rows, error } = await supabase
    .from("projects")
    .select("id, title, description");

  if (error) {
    console.error("Error:", error.message);
    return;
  }

  console.log(`Searching all ${rows?.length || 0} projects for "testing"...`);
  let found = false;

  for (const row of rows || []) {
    const desc = row.description as TiptapNode | null;
    if (!desc) continue;
    const matches = searchNodeForText(desc, "testing");
    if (matches.length > 0) {
      found = true;
      console.log(`\n========================================`);
      console.log(`PROJECT ID: ${row.id}`);
      console.log(`TITLE: ${row.title}`);
      console.log(`MATCHES:`);
      matches.forEach((m) => {
        console.log(`  Path: ${m.path}`);
        console.log(`  Text: "${m.text}"`);
      });
      console.log(`========================================`);
    }
  }

  if (!found) {
    console.log("No projects found with the word 'testing'.");
  }
}

searchAllProjects().catch(console.error);
