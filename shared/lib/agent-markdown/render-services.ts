import { SERVICE_LINES, normalizeServiceLine, type ServiceLine } from "@/modules/service/domain/line";
import { buildFrontmatter, buildInquirySection } from "@/shared/lib/agent-markdown/render";
import { richTextToMarkdown } from "@/shared/lib/agent-markdown/richtext-to-markdown";
import { BASE_URL } from "@/shared/lib/seo-schema";

export interface ServiceIndexItem {
  title: string;
  slug: string;
  description?: unknown;
  line?: ServiceLine | string | null;
}

export interface ServiceDetailInput extends ServiceIndexItem {
  labels?: string[] | null;
  content?: unknown;
  briefPrompts?: string[] | null;
  metaDescription?: string | null;
  updatedAt?: string | null;
  faqs?: Array<{ question: string; answer: string }>;
}

const lineLabel = (line: unknown): string | null =>
  typeof line === "string" && line in SERVICE_LINES ? SERVICE_LINES[line as ServiceLine].label : null;

// `description` is a plain string today but is jsonb upstream: accept either.
export function descriptionText(d: unknown): string {
  if (d === null || d === undefined) return "";
  if (typeof d === "string") {
    const s = d.trim();
    if (s.startsWith("{")) {
      const md = richTextToMarkdown(s);
      if (md) return md.replace(/\s+/g, " ").trim();
    }
    return s.replace(/\s+/g, " ");
  }
  return richTextToMarkdown(d).replace(/\s+/g, " ").trim();
}

export function buildServiceIndexMarkdown(services: ServiceIndexItem[]): string {
  const out: string[] = [
    buildFrontmatter({
      title: "Dịch vụ - Điện máy ELC",
      description: "Danh sách dịch vụ thi công và dịch vụ máy lạnh của Điện máy ELC.",
      canonicalUrl: `${BASE_URL}/dich-vu`,
    }),
    "# Dịch vụ",
    "",
  ];
  for (const line of Object.keys(SERVICE_LINES) as ServiceLine[]) {
    const items = services.filter((s) => s.line === line);
    if (items.length === 0) continue;
    out.push(`## ${SERVICE_LINES[line].label}`, "", SERVICE_LINES[line].hubIntro, "");
    for (const s of items) out.push(serviceLine(s));
    out.push("");
  }
  const known = new Set(Object.keys(SERVICE_LINES));
  const others = services.filter((s) => !known.has(String(s.line)));
  if (others.length > 0) {
    out.push("## Khác", "");
    for (const s of others) out.push(serviceLine(s));
    out.push("");
  }
  out.push(buildInquirySection());
  return out.join("\n");
}

function serviceLine(s: ServiceIndexItem): string {
  const d = descriptionText(s.description);
  return `- [${s.title}](${BASE_URL}/dich-vu/${s.slug})${d ? `: ${d}` : ""}`;
}

export function buildServiceDetailMarkdown(
  s: ServiceDetailInput,
  related: ServiceIndexItem[] = [],
): string {
  const desc = descriptionText(s.description);
  const url = `${BASE_URL}/dich-vu/${s.slug}`;
  const out: string[] = [
    buildFrontmatter({
      title: s.title,
      description: s.metaDescription?.trim() || desc || s.title,
      canonicalUrl: url,
      updatedAt: s.updatedAt,
    }),
    `# ${s.title}`,
    "",
  ];
  const label = lineLabel(s.line);
  if (label) out.push(`Loại: ${label}`, "");
  if (desc) out.push(`> ${desc}`, "");
  if (s.labels?.length) {
    for (const l of s.labels) out.push(`- ${l}`);
    out.push("");
  }
  const body = richTextToMarkdown(s.content);
  if (body) out.push(body, "");
  if (s.faqs?.length) {
    out.push("## Câu hỏi thường gặp", "");
    for (const f of s.faqs) out.push(`### ${f.question}`, "", f.answer, "");
  }
  if (s.briefPrompts?.length) {
    // Same heading the HTML page uses (ServiceDetailModule: lineInfo.briefHeading).
    out.push(`## ${SERVICE_LINES[normalizeServiceLine(s.line)].briefHeading}`, "");
    for (const p of s.briefPrompts) out.push(`- ${p}`);
    out.push("");
  }
  if (related.length > 0) {
    out.push("## Dịch vụ liên quan", "");
    for (const r of related) out.push(serviceLine(r));
    out.push("");
  }
  out.push(`Trang web: [${s.title}](${url})`, "", buildInquirySection());
  return out.join("\n");
}

export function buildServiceNotFoundMarkdown(): string {
  return [
    "# 404 - Không tìm thấy dịch vụ",
    "",
    "Dịch vụ bạn yêu cầu không tồn tại hoặc chưa được công bố.",
    "",
    `- [Danh sách dịch vụ](${BASE_URL}/dich-vu)`,
    `- [llms.txt](${BASE_URL}/llms.txt)`,
    "",
  ].join("\n");
}
