import { buildFactRows } from "@/modules/project/domain/facts-display";
import { provinceLabel } from "@/modules/project/domain/provinces";
import type { ProjectWithCategory } from "@/modules/project/domain/types";
import { excerptFromRichText } from "@/shared/lib/rich-text";
import { BASE_URL } from "@/shared/lib/seo-schema";
import { richTextToMarkdown } from "./richtext-to-markdown";
import { buildFrontmatter, buildInquirySection } from "./render";

// Pure builders for /du-an and /du-an/<slug> Markdown. PRIVACY: client_name is
// emitted only when clientConsentAt is set; testimonials and client kind are
// never emitted (the HTML page does not show them either).

// Hard safety ceiling only: every published project is listed up to this many.
export const PROJECT_INDEX_LIMIT = 500;

type ProjectLike = Pick<
  ProjectWithCategory,
  "title" | "slug" | "description" | "images" | "facts" | "completedAt" | "services" | "categories" | "location" | "projectType" | "updatedAt"
> & { clientName?: string };

function placeOf(p: ProjectLike): string {
  const f = p.facts;
  const place = [f?.ward, f?.province ? provinceLabel(f.province) : ""].filter(Boolean).join(", ");
  return place || p.location?.trim() || "";
}

export function buildProjectMarkdown(p: ProjectLike): string {
  const url = `${BASE_URL}/du-an/${p.slug}`;
  const consented = Boolean(p.facts?.clientConsentAt);
  // Never pass clientName to the fact builder unless consent is on record.
  const rows = buildFactRows({
    facts: p.facts,
    completedAt: p.completedAt,
    services: p.services,
    categories: p.categories,
    clientName: consented ? p.clientName : undefined,
  });
  const out: string[] = [
    buildFrontmatter({
      title: p.title,
      description: excerptFromRichText(p.description) ?? p.title,
      canonicalUrl: url,
      updatedAt: p.updatedAt,
    }),
    `# ${p.title}`,
    "",
  ];
  const type = p.categories?.[0]?.name || p.projectType?.name;
  if (type) out.push(`Loại dự án: ${type}`, "");
  const place = placeOf(p);
  if (place && !rows.some((r) => r.label === "Địa điểm")) out.push(`Địa điểm: ${place}`, "");
  if (rows.length > 0) {
    out.push("## Thông tin dự án", "");
    for (const r of rows) out.push(`- **${r.label}**: ${r.value}`);
    out.push("");
  }
  const body = richTextToMarkdown(p.description, { baseUrl: BASE_URL });
  if (body.trim()) out.push("## Mô tả", "", body.trim(), "");
  const images = (p.images ?? []).filter((i) => i?.url);
  if (images.length > 0) {
    out.push("## Hình ảnh", "");
    images.forEach((img, i) => {
      const abs = new URL(img.url, BASE_URL).toString();
      out.push(`- ![${(img.alt || `${p.title} - ảnh ${i + 1}`).replace(/[\[\]\n]/g, " ")}](${abs})`);
    });
    out.push("");
  }
  out.push(`Xem trang đầy đủ: [${p.title}](${url})`, "");
  out.push(
    "Bạn có nhu cầu một công trình tương tự? Điện máy ELC có thể khảo sát và báo giá theo quy mô của bạn.",
    "",
    buildInquirySection(),
  );
  return out.join("\n");
}

export function buildProjectIndexMarkdown(
  projects: ProjectLike[],
  opts?: { heading?: string; canonicalPath?: string; total?: number },
): string {
  const heading = opts?.heading ?? "Dự án thi công điều hòa và thông gió của Điện máy ELC";
  const shown = projects.slice(0, PROJECT_INDEX_LIMIT);
  const out: string[] = [
    buildFrontmatter({
      title: heading,
      description: "Danh sách công trình điều hòa, VRV/VRF và thông gió đã thi công.",
      canonicalUrl: `${BASE_URL}${opts?.canonicalPath ?? "/du-an"}`,
    }),
    `# ${heading}`,
    "",
  ];
  if (shown.length === 0) out.push("Chưa có dự án nào.", "");
  for (const p of shown) {
    const bits = [placeOf(p), excerptFromRichText(p.description, 100)].filter(Boolean).join(" - ");
    out.push(`- [${p.title}](${BASE_URL}/du-an/${p.slug})${bits ? `: ${bits}` : ""}`);
  }
  out.push("");
  const total = Math.max(opts?.total ?? 0, projects.length);
  if (total > shown.length) {
    out.push(`Hiển thị ${shown.length} dự án đầu tiên; xem đầy đủ tại [${BASE_URL}/du-an](${BASE_URL}/du-an).`, "");
  }
  out.push(buildInquirySection());
  return out.join("\n");
}

export function buildProjectNotFoundMarkdown(): string {
  return [
    "# 404 - Không tìm thấy dự án",
    "",
    "Dự án bạn yêu cầu không tồn tại hoặc chưa được công bố.",
    "",
    `- [Danh sách dự án](${BASE_URL}/du-an)`,
    `- [llms.txt](${BASE_URL}/llms.txt)`,
    "",
  ].join("\n");
}
