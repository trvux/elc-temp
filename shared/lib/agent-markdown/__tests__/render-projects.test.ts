import { describe, expect, it } from "vitest";
import { EMPTY_FACTS } from "@/modules/project/domain/types";
import {
  buildProjectIndexMarkdown,
  buildProjectMarkdown,
  buildProjectNotFoundMarkdown,
  PROJECT_INDEX_LIMIT,
} from "@/shared/lib/agent-markdown/render-projects";
import { BASE_URL } from "@/shared/lib/seo-schema";

const doc = { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Lắp VRV cho văn phòng." }] }] };
const mk = (over: Record<string, unknown> = {}) =>
  ({
    title: "Văn phòng A",
    slug: "van-phong-a",
    description: doc,
    images: [{ url: "/img/a.jpg", alt: "a" }],
    facts: { ...EMPTY_FACTS, province: "", brands: ["Daikin"], capacityHp: 20, indoorUnits: 8 },
    completedAt: null,
    clientName: "Nguyen Van Secret",
    updatedAt: "2026-01-01T00:00:00Z",
    ...over,
  }) as never;

describe("buildProjectMarkdown", () => {
  const md = buildProjectMarkdown(mk());
  it("renders title, specs, brands, absolute image, link, inquiry", () => {
    expect(md).toContain("# Văn phòng A");
    expect(md).toContain("20 HP");
    expect(md).toContain("Daikin");
    expect(md).toContain(`${BASE_URL}/img/a.jpg`);
    expect(md).toContain(`${BASE_URL}/du-an/van-phong-a`);
    expect(md).toContain("Yêu cầu báo giá");
    expect(md).toContain("Lắp VRV");
  });
  it("never outputs client_name without consent", () => {
    expect(md).not.toContain("Nguyen Van Secret");
    const withTestimonial = buildProjectMarkdown(mk({ testimonialQuote: "Quote bí mật", testimonialAuthor: "Tác giả" }));
    expect(withTestimonial).not.toContain("Quote bí mật");
    expect(withTestimonial).not.toContain("Tác giả");
  });
  it("outputs client_name only with consent", () => {
    const consented = buildProjectMarkdown(
      mk({ facts: { ...EMPTY_FACTS, brands: ["Daikin"], clientConsentAt: "2026-01-01" } }),
    );
    expect(consented).toContain("Nguyen Van Secret");
  });
});

describe("buildProjectIndexMarkdown", () => {
  it("lists links and flags truncation", () => {
    const many = Array.from({ length: PROJECT_INDEX_LIMIT + 1 }, (_, i) => mk({ title: `P${i}`, slug: `p${i}` }));
    const md = buildProjectIndexMarkdown(many);
    expect(md).toContain(`(${BASE_URL}/du-an/p0)`);
    expect(md).not.toContain(`/du-an/p${PROJECT_INDEX_LIMIT})`);
    expect(md).toContain("Hiển thị");
    expect(md).not.toContain("Nguyen Van Secret");
  });
  it("no truncation note for short lists", () => {
    expect(buildProjectIndexMarkdown([mk()])).not.toContain("Hiển thị");
  });
});

describe("buildProjectNotFoundMarkdown", () => {
  it("is a short 404 body", () => {
    expect(buildProjectNotFoundMarkdown()).toMatch(/^# 404/);
  });
});
