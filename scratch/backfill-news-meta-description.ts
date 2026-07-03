import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Paragraph-aware variant of app/(public)/tin-tuc/page.tsx's getExcerptFromContent.
// The original flat-walks every text node regardless of paragraph boundaries, which
// occasionally starts mid-word when a heading node swallows the first word of a
// malformed doc (found while dry-running this against real data — see below).
// Duplicated rather than imported since this is a one-off migration script.
interface TiptapNode {
  type?: string;
  text?: string;
  content?: TiptapNode[];
}

// A paragraph is trustworthy as an excerpt-starting point only if it reads like
// the start of a sentence — Vietnamese/ASCII uppercase, digit, or opening quote.
// Guards against malformed TipTap docs where a heading swallows the first word
// and the paragraph node is left starting mid-word (e.g. "oặc rò rỉ gas...").
function looksLikeSentenceStart(text: string): boolean {
  return /^["“'(]?[A-ZÀ-Ỹ0-9]/.test(text.trim());
}

function textOf(node: TiptapNode): string {
  if (node.type === "text") return node.text ?? "";
  return (node.content ?? []).map(textOf).join("");
}

function excerptFromContent(content: unknown, fallback: string): string {
  if (!content) return fallback;
  try {
    let doc: TiptapNode | null = null;
    if (typeof content === "string") {
      const trimmed = content.trim();
      if (trimmed.startsWith("{")) {
        doc = JSON.parse(trimmed) as TiptapNode;
      } else {
        const stripped = content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
        return stripped.length > 160 ? stripped.slice(0, 157) + "..." : stripped || fallback;
      }
    } else if (typeof content === "object") {
      doc = content as TiptapNode;
    }
    if (!doc) return fallback;

    const paragraphs: string[] = [];
    const collectParagraphs = (n: TiptapNode) => {
      if (n.type === "paragraph") {
        const text = textOf(n).replace(/\s+/g, " ").trim();
        if (text) paragraphs.push(text);
        return; // don't descend further — paragraph is a leaf for this purpose
      }
      n.content?.forEach(collectParagraphs);
    };
    collectParagraphs(doc);

    const usable = paragraphs.filter(looksLikeSentenceStart);
    const source = usable.length > 0 ? usable : paragraphs;
    const text = source.join(" ").replace(/\s+/g, " ").trim();
    return text.length > 160 ? text.slice(0, 157) + "..." : text || fallback;
  } catch (err) {
    console.error("parse error:", err);
  }
  return fallback;
}

async function main() {
  const dryRun = !process.argv.includes("--apply");

  const { data: news, error } = await supabase
    .from("news")
    .select("id, slug, title, content, meta_description")
    .eq("is_published", true)
    .is("deleted_at", null);
  if (error) throw error;

  const toUpdate = (news ?? []).filter((n) => !n.meta_description);
  console.log(`${toUpdate.length}/${news?.length} articles missing meta_description. dryRun=${dryRun}\n`);

  for (const n of toUpdate) {
    const description = excerptFromContent(n.content, n.title);
    console.log(`- ${n.slug}\n    (${description.length} chars) ${description}\n`);

    if (!dryRun) {
      const { error: updErr } = await supabase
        .from("news")
        .update({ meta_description: description })
        .eq("id", n.id);
      if (updErr) console.error(`  FAILED ${n.slug}:`, updErr.message);
    }
  }

  console.log(dryRun ? "\nDry run only — re-run with --apply to write to DB." : "\nDone.");
}

main().catch(console.error);
