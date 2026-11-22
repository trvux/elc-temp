import { describe, expect, it } from "vitest";
import {
  buildServiceDetailMarkdown,
  buildServiceIndexMarkdown,
  buildServiceNotFoundMarkdown,
} from "@/shared/lib/agent-markdown/render-services";
import { BASE_URL } from "@/shared/lib/seo-schema";

const content = {
  type: "doc",
  content: [{ type: "paragraph", content: [{ type: "text", text: "Nội dung chi tiết" }] }],
};

describe("buildServiceIndexMarkdown", () => {
  const md = buildServiceIndexMarkdown([
    { title: "Vệ sinh", slug: "ve-sinh", description: "Mô tả ngắn", line: "dich-vu" },
    { title: "VRV", slug: "vrv", description: null, line: "thi-cong" },
  ]);
  it("links services with description", () => {
    expect(md).toContain(`- [Vệ sinh](${BASE_URL}/dich-vu/ve-sinh): Mô tả ngắn`);
    expect(md).toContain(`- [VRV](${BASE_URL}/dich-vu/vrv)`);
    expect(md).toContain("# Dịch vụ");
  });
});

describe("buildServiceDetailMarkdown", () => {
  const md = buildServiceDetailMarkdown({
    title: "Vệ sinh",
    slug: "ve-sinh",
    description: "Mô tả",
    line: "dich-vu",
    labels: ["Bảo hành"],
    content,
    briefPrompts: ["Số máy"],
    faqs: [{ question: "Giá?", answer: "Báo giá." }],
  });
  it("renders all sections", () => {
    expect(md).toContain("# Vệ sinh");
    expect(md).toContain("> Mô tả");
    expect(md).toContain("- Bảo hành");
    expect(md).toContain("Nội dung chi tiết");
    expect(md).toContain("### Giá?");
    expect(md).toContain("- Số máy");
    expect(md).toContain(`canonical: ${BASE_URL}/dich-vu/ve-sinh`);
    expect(md).toContain("## Yêu cầu báo giá");
  });
  it("tolerates missing content and jsonb description", () => {
    const m = buildServiceDetailMarkdown({ title: "A", slug: "a", description: content, content: null });
    expect(m).toContain("> Nội dung chi tiết");
  });
});

describe("buildServiceNotFoundMarkdown", () => {
  it("is a short 404 body", () => {
    expect(buildServiceNotFoundMarkdown()).toMatch(/^# 404/);
  });
});
