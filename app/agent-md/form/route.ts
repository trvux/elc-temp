import { markdownHeaders } from "@/shared/lib/agent-markdown/render";
import { buildFormMarkdown } from "@/shared/lib/agent-markdown/render-pages";

// Not a public URL: proxy.ts rewrites `GET /form` (and /form.md) here for Markdown clients.
// Static: the HTML page is a client-side wizard with nothing to read from the DB.
export async function GET() {
  return new Response(buildFormMarkdown(), { status: 200, headers: markdownHeaders("/form") });
}
