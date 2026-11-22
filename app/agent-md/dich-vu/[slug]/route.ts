import { connection } from "next/server";
import { getFAQsAction } from "@/modules/faq";
import { getServiceBySlugAction } from "@/modules/service/presentation/actions";
import { MARKDOWN_HEADERS, markdownHeaders } from "@/shared/lib/agent-markdown/render";
import {
  buildServiceDetailMarkdown,
  buildServiceNotFoundMarkdown,
} from "@/shared/lib/agent-markdown/render-services";

// Internal target of the proxy.ts rewrite for `/dich-vu/<slug>` (Markdown requested).
export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  await connection();
  const { slug } = await ctx.params;
  const service = await getServiceBySlugAction(slug);
  if (!service || !service.isPublished) {
    return new Response(buildServiceNotFoundMarkdown(), { status: 404, headers: MARKDOWN_HEADERS });
  }
  const { data: faqs } = await getFAQsAction("service", service.id);
  const body = buildServiceDetailMarkdown({ ...service, faqs });
  return new Response(body, { status: 200, headers: markdownHeaders(`/dich-vu/${service.slug}`) });
}
