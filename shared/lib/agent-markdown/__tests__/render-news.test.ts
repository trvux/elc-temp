import { describe, expect, it } from "vitest";
import {
  buildNewsDetailMarkdown,
  buildNewsIndexMarkdown,
  buildNewsNotFoundMarkdown,
  NEWS_INDEX_LIMIT,
} from "@/shared/lib/agent-markdown/render-news";
import { BASE_URL } from "@/shared/lib/seo-schema";

const doc = {
  type: "doc",
  content: [{ type: "paragraph", content: [{ type: "text", text: "Nội dung bài" }] }],
};

describe("buildNewsDetailMarkdown", () => {
  const md = buildNewsDetailMarkdown({
    title: "Bài A",
    slug: "bai-a",
    createdAt: "2026-01-02T00:00:00Z",
    updatedAt: "2026-02-03T00:00:00Z",
    excerpt: "Tóm tắt",
    content: doc,
  });
  it("has frontmatter, title, dates, summary, body, html link, inquiry", () => {
    expect(md).toContain(`canonical: ${BASE_URL}/tin-tuc/bai-a`);
    expect(md).toContain("# Bài A");
    expect(md).toContain("Đăng ngày: 2026-01-02");
    expect(md).toContain("Cập nhật: 2026-02-03");
    expect(md).toContain("> Tóm tắt");
    expect(md).toContain("Nội dung bài");
    expect(md).toContain(`(${BASE_URL}/tin-tuc/bai-a)`);
    expect(md).toContain("## Yêu cầu báo giá");
  });
  it("tolerates empty content", () => {
    expect(buildNewsDetailMarkdown({ title: "X", slug: "x", content: null })).toContain("# X");
  });
});

describe("buildNewsDetailMarkdown extras", () => {
  const md = buildNewsDetailMarkdown(
    { title: "X", slug: "x", content: null },
    {
      faqs: [{ question: "Hỏi?", answer: "Đáp" }, { question: " ", answer: "bỏ" }],
      relatedProducts: [{ name: "SP", slug: "sp", displayPrice: 1000000 }, { name: "SP2", slug: "sp2" }],
      relatedProductsEntity: { slug: "cat" },
      relatedProductsTotal: 20,
      relatedNews: [{ title: "B", slug: "b", createdAt: "2026-03-04T00:00:00Z" }],
    },
  );
  it("renders FAQ, related products, related news in order", () => {
    const i = [md.indexOf("## Câu hỏi thường gặp"), md.indexOf("## Sản phẩm liên quan"), md.indexOf("## Bài viết liên quan")];
    expect(i.every((v) => v >= 0)).toBe(true);
    expect([...i].sort((a, b) => a - b)).toEqual(i);
    expect(md).toContain("### Hỏi?");
    expect(md).not.toContain("bỏ");
    expect(md).toContain(`- [SP](${BASE_URL}/san-pham/sp): 1.000.000 VND`);
    expect(md).toContain(`- [SP2](${BASE_URL}/san-pham/sp2)\n`);
    expect(md).toContain(`(${BASE_URL}/san-pham/cat)`);
    expect(md).toContain(`- [B](${BASE_URL}/tin-tuc/b) (2026-03-04)`);
  });
  it("omits sections without data", () => {
    const plain = buildNewsDetailMarkdown({ title: "X", slug: "x", content: null });
    expect(plain).not.toContain("## Câu hỏi");
    expect(plain).not.toContain("liên quan");
  });
});

describe("buildNewsIndexMarkdown", () => {
  const items = Array.from({ length: 60 }, (_, i) => ({
    title: `T${i}`,
    slug: `t${i}`,
    createdAt: "2026-01-02T00:00:00Z",
    excerpt: "e",
  }));
  it("lists every item without a note when under the ceiling", () => {
    const md = buildNewsIndexMarkdown(items, 60);
    expect(md.match(/^- \[/gm)).toHaveLength(60);
    expect(md).not.toContain("trên tổng số");
    expect(md).toContain(`[T0](${BASE_URL}/tin-tuc/t0) (2026-01-02): e`);
  });
  it("caps only at the safety ceiling and says so", () => {
    const many = Array.from({ length: NEWS_INDEX_LIMIT + 1 }, (_, i) => ({ title: `T${i}`, slug: `t${i}` }));
    const md = buildNewsIndexMarkdown(many, NEWS_INDEX_LIMIT + 1);
    expect(md.match(/^- \[/gm)).toHaveLength(NEWS_INDEX_LIMIT);
    expect(md).toContain(`trên tổng số ${NEWS_INDEX_LIMIT + 1}`);
  });
  it("handles empty", () => {
    expect(buildNewsIndexMarkdown([])).toContain("chưa có tin tức");
  });
});

describe("buildNewsNotFoundMarkdown", () => {
  it("is a short 404 body", () => {
    expect(buildNewsNotFoundMarkdown()).toMatch(/^# 404/);
  });
});
