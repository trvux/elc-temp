import { describe, expect, it } from "vitest";
import {
  buildBranchMarkdown,
  buildInfoHubMarkdown,
  buildPageNotFoundMarkdown,
  buildStaticPageMarkdown,
} from "@/shared/lib/agent-markdown/render-pages";
import { BASE_URL } from "@/shared/lib/seo-schema";

const doc = (text: string) => ({
  type: "doc",
  content: [{ type: "paragraph", content: [{ type: "text", text }] }],
});

describe("buildStaticPageMarkdown", () => {
  it("uses the real canonical URL, title, dates and body", () => {
    const md = buildStaticPageMarkdown({
      title: "Giới thiệu",
      slug: "gioi-thieu-ve-dien-may-elc",
      content: doc("Nội dung ELC"),
      metaDescription: "Mô tả",
      createdAt: "2026-01-02T00:00:00Z",
      updatedAt: "2026-02-03T00:00:00Z",
    });
    expect(md).toContain(`canonical: ${BASE_URL}/gioi-thieu-ve-dien-may-elc`);
    expect(md).toContain("# Giới thiệu");
    expect(md).toContain("Đăng ngày: 2026-01-02 · Cập nhật: 2026-02-03");
    expect(md).toContain("Nội dung ELC");
    expect(md).toContain("## Yêu cầu báo giá");
  });
});

describe("buildBranchMarkdown", () => {
  it("lists contact facts and skips empty ones", () => {
    const md = buildBranchMarkdown({ name: "Văn phòng", slug: "van-phong", address: "1 A", phone: "0900", description: doc("Mô tả cơ sở") });
    expect(md).toContain(`canonical: ${BASE_URL}/thong-tin/van-phong`);
    expect(md).toContain("- **Địa chỉ**: 1 A");
    expect(md).toContain("- **Điện thoại**: 0900");
    expect(md).not.toContain("**Email**");
    expect(md).toContain("Mô tả cơ sở");
  });
});

describe("buildInfoHubMarkdown / not found", () => {
  it("links pages and branches", () => {
    const md = buildInfoHubMarkdown({ pages: [{ title: "Bảo hành", slug: "chinh-sach-bao-hanh-san-pham" }], branches: [{ name: "Kho", slug: "kho-hang", address: "2 B" }] });
    expect(md).toContain(`canonical: ${BASE_URL}/thong-tin`);
    expect(md).toContain(`[Bảo hành](${BASE_URL}/chinh-sach-bao-hanh-san-pham)`);
    expect(md).toContain(`### [Kho](${BASE_URL}/thong-tin/kho-hang)`);
  });
  it("empty hub and 404 body", () => {
    expect(buildInfoHubMarkdown({ pages: [], branches: [] })).toContain("Chưa có thông tin nào");
    expect(buildPageNotFoundMarkdown()).toMatch(/^# 404/);
  });
});
