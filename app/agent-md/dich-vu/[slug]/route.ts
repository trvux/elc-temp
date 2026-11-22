import { connection } from "next/server";
import { getFAQsAction } from "@/modules/faq";
import { getServiceBySlugAction, getServicesAction } from "@/modules/service/presentation/actions";
import { MARKDOWN_HEADERS, markdownHeaders } from "@/shared/lib/agent-markdown/render";
import {
  buildServiceDetailMarkdown,
  buildServiceNotFoundMarkdown,
} from "@/shared/lib/agent-markdown/render-services";
import { buildPublicPath } from "@/shared/lib/agent-markdown/fetch-html";
import { servePageMarkdown } from "@/shared/lib/agent-markdown/page-markdown";

// Internal target of the proxy.ts rewrite for `/dich-vu/<slug>` (Markdown requested).
async function legacy(slug: string) {
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

export async function GET(request: Request, ctx: { params: Promise<{ slug: string }> }) {
  await connection();
  const { slug } = await ctx.params;
  const legacyForSlug = () => legacy(slug);
  const publicPath = buildPublicPath(["dich-vu", slug]);
  if (!publicPath) return legacyForSlug();
  const res = await servePageMarkdown({ request, publicPath, fallback: legacyForSlug });
  // page-markdown's 404 body is generic; the legacy builder has the right not-found text for this section.
  return res.status === 404 ? legacyForSlug() : res;
}
