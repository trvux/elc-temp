import { connection } from "next/server";
import { getServicesAction } from "@/modules/service/presentation/actions";
import { markdownHeaders } from "@/shared/lib/agent-markdown/render";
import { buildServiceIndexMarkdown } from "@/shared/lib/agent-markdown/render-services";
import { servePageMarkdown } from "@/shared/lib/agent-markdown/page-markdown";

// Internal target of the proxy.ts rewrite for `/dich-vu` (Markdown requested).
async function legacy() {
  const { data } = await getServicesAction({ isPublished: true });
  return new Response(buildServiceIndexMarkdown(data), {
    status: 200,
    headers: markdownHeaders("/dich-vu"),
  });
}

export async function GET(request: Request) {
  await connection();
  const res = await servePageMarkdown({ request, publicPath: "/dich-vu", fallback: legacy });
  return res.status === 404 ? legacy() : res;
}
