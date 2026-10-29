import { buildGoneMarkdown, MARKDOWN_HEADERS } from "@/shared/lib/agent-markdown/render";

// Not a public URL: nginx rewrites dead (410) paths here when the client
// prefers Markdown (deploy/nginx/install.sh). No DB access on purpose - the
// 410 allowlist exists so dead URLs never cost a query.
export function GET() {
  return new Response(buildGoneMarkdown(), { status: 410, headers: MARKDOWN_HEADERS });
}
