import { buildFrontmatter, buildInquirySection, TRUST_PAGES } from "@/shared/lib/agent-markdown/render";
import { richTextToMarkdown } from "@/shared/lib/agent-markdown/richtext-to-markdown";
import { BASE_URL } from "@/shared/lib/seo-schema";

const oneLine = (s: string) => s.replace(/\s+/g, " ").trim();

function dateOnly(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

export interface StaticPageInput {
  title: string;
  slug: string;
  content: unknown;
  metaTitle?: string | null;
  metaDescription?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export function buildStaticPageMarkdown(p: StaticPageInput): string {
  const url = `${BASE_URL}/${p.slug}`;
  const title = oneLine(p.title);
  const description = p.metaDescription ? oneLine(p.metaDescription) : title;
  const out: string[] = [
    buildFrontmatter({ title: oneLine(p.metaTitle || p.title), description, canonicalUrl: url, updatedAt: p.updatedAt || undefined }),
    `# ${title}`,
    "",
  ];
  const created = dateOnly(p.createdAt);
  const updated = dateOnly(p.updatedAt);
  const meta: string[] = [];
  if (created) meta.push(`Đăng ngày: ${created}`);
  if (updated && updated !== created) meta.push(`Cập nhật: ${updated}`);
  if (meta.length) out.push(meta.join(" · "), "");
  const body = richTextToMarkdown(p.content, { baseUrl: BASE_URL });
  if (body) out.push(body, "");
  out.push(`Bản HTML: [${url}](${url}) · [Thông tin & chính sách](${TRUST_PAGES.contact})`, "", buildInquirySection());
  return out.join("\n");
}

export interface BranchMarkdownInput {
  name: string;
  slug: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  mapsUrl?: string | null;
  description?: unknown;
  metaDescription?: string | null;
  updatedAt?: string | null;
}

function branchFacts(b: BranchMarkdownInput): string[] {
  const out: string[] = [];
  if (b.address) out.push(`- **Địa chỉ**: ${oneLine(b.address)}`);
  if (b.phone) out.push(`- **Điện thoại**: ${oneLine(b.phone)}`);
  if (b.email) out.push(`- **Email**: ${oneLine(b.email)}`);
  if (b.mapsUrl) out.push(`- **Bản đồ**: ${b.mapsUrl}`);
  return out;
}

export function buildBranchMarkdown(b: BranchMarkdownInput): string {
  const url = `${BASE_URL}/thong-tin/${b.slug}`;
  const name = oneLine(b.name);
  const out: string[] = [
    buildFrontmatter({
      title: `${name} | Điện máy ELC`,
      description: b.metaDescription ? oneLine(b.metaDescription) : b.address ? oneLine(b.address) : name,
      canonicalUrl: url,
      updatedAt: b.updatedAt || undefined,
    }),
    `# ${name}`,
    "",
  ];
  const facts = branchFacts(b);
  if (facts.length) out.push("## Thông tin liên hệ", "", ...facts, "");
  const body = richTextToMarkdown(b.description, { baseUrl: BASE_URL });
  if (body) out.push(body, "");
  out.push(`Bản HTML: [${url}](${url}) · [Tất cả chi nhánh](${TRUST_PAGES.contact})`, "", buildInquirySection());
  return out.join("\n");
}

export interface InfoHubInput {
  pages: Array<{ title: string; slug: string }>;
  branches: BranchMarkdownInput[];
}

export function buildInfoHubMarkdown(input: InfoHubInput): string {
  const description =
    "Địa chỉ văn phòng, showroom, kho bãi kỹ thuật của Điện máy ELC — thông tin liên hệ, bản đồ và giờ làm việc từng chi nhánh.";
  const out: string[] = [
    buildFrontmatter({ title: "Thông tin liên hệ & chi nhánh | Điện máy ELC", description, canonicalUrl: TRUST_PAGES.contact }),
    "# Thông tin về ELC",
    "",
    "> Các chính sách thương mại và dịch vụ công ty cam kết luôn luôn theo đuổi cam kết thực hiện",
    "",
    "## Giới thiệu và chính sách",
    "",
  ];
  if (input.pages.length === 0) out.push("Chưa có thông tin nào được cập nhật.", "");
  else {
    for (const p of input.pages) out.push(`- [${oneLine(p.title)}](${BASE_URL}/${p.slug})`);
    out.push("");
  }
  out.push(
    "## Cơ sở hạ tầng",
    "",
    "Hệ thống không gian trưng bày và trạm dịch vụ của ELC được mở rộng trên toàn quốc với triết lý kiến tạo giá trị đồng nhất",
    "",
  );
  for (const b of input.branches) {
    out.push(`### [${oneLine(b.name)}](${BASE_URL}/thong-tin/${b.slug})`, "", ...branchFacts(b), "");
  }
  out.push(buildInquirySection());
  return out.join("\n");
}

export function buildPageNotFoundMarkdown(): string {
  return [
    "# 404 Không tìm thấy trang",
    "",
    "Trang này không tồn tại hoặc đã bị gỡ.",
    "",
    `- [Thông tin & chính sách](${TRUST_PAGES.contact})`,
    `- [Sitemap](${BASE_URL}/sitemap.xml)`,
    "",
  ].join("\n");
}
