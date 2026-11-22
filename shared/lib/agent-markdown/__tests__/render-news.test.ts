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

describe("buildNewsIndexMarkdown", () => {
  const items = Array.from({ length: 60 }, (_, i) => ({
    title: `T${i}`,
    slug: `t${i}`,
    createdAt: "2026-01-02T00:00:00Z",
    excerpt: "e",
  }));
  it("caps and says so", () => {
    const md = buildNewsIndexMarkdown(items, 180);
    expect(md.match(/^- \[/gm)).toHaveLength(NEWS_INDEX_LIMIT);
    expect(md).toContain("trên tổng số 180");
    expect(md).toContain(`[T0](${BASE_URL}/tin-tuc/t0) (2026-01-02): e`);
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
