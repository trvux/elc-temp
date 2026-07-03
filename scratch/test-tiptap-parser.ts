import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function tiptapToText(node: unknown): string {
  if (!node) return "";
  if (typeof node === "object") {
    const obj = node as Record<string, unknown>;
    if (obj.type === "text" && typeof obj.text === "string") {
      return obj.text;
    }
    if (Array.isArray(obj.content)) {
      return obj.content.map(tiptapToText).join(" ");
    }
  }
  if (Array.isArray(node)) {
    return node.map(tiptapToText).join(" ");
  }
  return "";
}

async function test() {
  const { data } = await supabase
    .from("products")
    .select("name, description")
    .is("deleted_at", null)
    .eq("is_published", true)
    .limit(3);

  for (const p of data || []) {
    console.log(`\nName: ${p.name}`);
    const text = tiptapToText(p.description);
    console.log(`Parsed text (length ${text.length}):`);
    console.log(text.substring(0, 400) + "...");
  }
}

test().catch(console.error);
