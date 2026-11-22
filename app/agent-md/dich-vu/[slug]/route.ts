import { connection } from "next/server";
import { getFAQsAction } from "@/modules/faq";
import { getServiceBySlugAction, getServicesAction } from "@/modules/service/presentation/actions";
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
  // Same rule as the HTML RelatedServices block: other published services of the same line, first 3.
  const { data: published } = await getServicesAction({ isPublished: true });
  const related = published.filter((s) => s.line === service.line && s.id !== service.id).slice(0, 3);
  const body = buildServiceDetailMarkdown({ ...service, faqs }, related);
  return new Response(body, { status: 200, headers: markdownHeaders(`/dich-vu/${service.slug}`) });
}
