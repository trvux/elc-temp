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

async function searchProjectText() {
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
  const desc = project.description as TiptapNode | null;
  if (!desc) {
    console.log("Description is empty.");
    return;
  }

  console.log(`Project: ${project.title}`);
  const matches = searchNodeForText(desc, "testing");
  console.log(`Found ${matches.length} matches for "testing":`);
  matches.forEach((m, idx) => {
    console.log(`\nMatch #${idx + 1}:`);
    console.log(`Path: ${m.path}`);
    console.log(`Text: "${m.text}"`);
    console.log(`Node:`, JSON.stringify(m.node, null, 2));
  });
}

searchProjectText().catch(console.error);
