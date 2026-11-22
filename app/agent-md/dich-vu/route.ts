import { connection } from "next/server";
import { getServicesAction } from "@/modules/service/presentation/actions";
import { markdownHeaders } from "@/shared/lib/agent-markdown/render";
import { buildServiceIndexMarkdown } from "@/shared/lib/agent-markdown/render-services";

// Internal target of the proxy.ts rewrite for `/dich-vu` (Markdown requested).
export async function GET() {
  await connection();
  const { data } = await getServicesAction({ isPublished: true });
  return new Response(buildServiceIndexMarkdown(data), {
    status: 200,
    headers: markdownHeaders("/dich-vu"),
  });
}
