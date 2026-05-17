import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Error: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

// Bypasses Row Level Security (RLS) to modify rows
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

type TiptapNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
  [key: string]: unknown;
};

// Recursive helper to normalize heading node attributes
function normalizeHeadingAttrs(node: TiptapNode, stats: { patched: number }): TiptapNode {
  const normalizedContent = node.content
    ? node.content.map((n) => normalizeHeadingAttrs(n, stats))
    : undefined;

  if (node.type === "heading") {
    // If attrs is missing or attrs.level is missing, patch it
    if (!node.attrs || node.attrs.level === undefined) {
      stats.patched++;
      return {
        ...node,
        attrs: { level: 1, ...(node.attrs ?? {}) },
        ...(normalizedContent !== undefined ? { content: normalizedContent } : {}),
      };
    }
  }

  return normalizedContent !== undefined
    ? { ...node, content: normalizedContent }
    : node;
}

// Normalizes the root Tiptap document
function normalizeTiptapJson(value: unknown, stats: { patched: number }): unknown {
  if (!value || typeof value !== "object") return value;
  const doc = value as TiptapNode;
  if (!doc.content || doc.content.length === 0) return doc;

  const content = doc.content.map((node, index) => {
    // Dòng đầu tiên (index === 0) luôn phải là heading level 1 làm tiêu đề
    if (index === 0) {
      if (node.type === "paragraph" || node.type === "heading") {
        const hasLevel1 = node.type === "heading" && node.attrs && node.attrs.level === 1;
        if (!hasLevel1) {
          stats.patched++;
          return {
            ...node,
            type: "heading",
            attrs: {
              ...(node.attrs ?? {}),
              level: 1,
            },
          };
        }
      }
    }
    return normalizeHeadingAttrs(node, stats);
  });

  return { ...doc, content };
}

// Target tables configuration
const TARGET_TABLES = [
  { table: "projects", column: "description" },
  { table: "branches", column: "description" },
  { table: "products", column: "description" },
  { table: "news", column: "content" },
  { table: "pages", column: "content" },
  { table: "services", column: "content" },
];

async function repairDatabase() {
  console.log("Starting universal database heading repair...");
  
  for (const { table, column } of TARGET_TABLES) {
    console.log(`\nAnalyzing table: "${table}" (column: "${column}")...`);
    
    // Fetch all records from the table
    const { data: rows, error: fetchError } = await supabase
      .from(table)
      .select(`id, ${column}`);

    if (fetchError) {
      console.error(`Error fetching data from table "${table}":`, fetchError.message);
      continue;
    }

    if (!rows || rows.length === 0) {
      console.log(`Table "${table}" is empty or has no records.`);
      continue;
    }

    console.log(`Found ${rows.length} records. Checking for headings missing "attrs.level"...`);
    let tablePatchedCount = 0;

    for (const row of rows) {
      const rowObj = row as unknown as Record<string, unknown>;
      const originalValue = rowObj[column];
      if (!originalValue) continue;

      const stats = { patched: 0 };
      const normalizedValue = normalizeTiptapJson(originalValue, stats);

      if (stats.patched > 0) {
        // Update the record with patched JSON
        const { error: updateError } = await supabase
          .from(table)
          .update({ [column]: normalizedValue })
          .eq("id", rowObj.id);

        if (updateError) {
          console.error(`  - Failed to update record ID ${rowObj.id} in "${table}":`, updateError.message);
        } else {
          console.log(`  - Patched ID ${rowObj.id}: Added level attribute to ${stats.patched} heading(s).`);
          tablePatchedCount++;
        }
      }
    }

    console.log(`Finished table "${table}". Patched and updated ${tablePatchedCount} records.`);
  }

  console.log("\nDatabase repair complete!");
}

repairDatabase().catch((err) => {
  console.error("Fatal error during database repair:", err);
});
