import { describe, it, expect } from "vitest";
import {
  buildProjectSeo,
  variantOf,
  HEADLINE_MAX,
  META_TITLE_MAX,
  META_DESCRIPTION_MAX,
  type ProjectSeoFields,
} from "../../domain/seo";

const base: ProjectSeoFields = {
  typeSlug: "nha-pho",
  systems: ["cassette-am-tran"],
  brands: ["Daikin"],
  province: "TP.HCM",
  district: "Quận 5",
  completedAt: "2024-03-10",
};

describe("buildProjectSeo", () => {
  it("meta_title never contains the brand name ELC and respects length limits for every variant", () => {
    for (let variant = 0; variant < 8; variant++) {
      const r = buildProjectSeo(base, { variant });
      expect(r.metaTitle).not.toMatch(/elc/i);
      expect(r.headline).not.toMatch(/điện máy elc hoàn thành/i);
      expect(r.metaTitle.length).toBeLessThanOrEqual(META_TITLE_MAX);
      expect(r.headline.length).toBeLessThanOrEqual(HEADLINE_MAX);
      expect(r.metaDescription.length).toBeLessThanOrEqual(META_DESCRIPTION_MAX);
    }
  });

  it("contains system and area, written as sentence case", () => {
    const r = buildProjectSeo(base);
    expect(r.metaTitle.toLowerCase()).toContain("máy lạnh âm trần");
    expect(r.metaTitle).toContain("Quận 5");
    expect(r.headline).toContain("Quận 5");
    expect(r.metaTitle).not.toMatch(/\b[A-ZĐ][a-zà-ỹ]+ [A-ZĐ][a-zà-ỹ]+ [A-ZĐ][a-zà-ỹ]+ [A-ZĐ][a-zà-ỹ]+/);
  });

  it("different variants give different wording (a template that does not fit falls back to another)", () => {
    const set = new Set([0, 1, 2, 3].map((variant) => buildProjectSeo(base, { variant }).metaTitle));
    expect(set.size).toBeGreaterThanOrEqual(3);
    const headlines = new Set([0, 1, 2, 3].map((variant) => buildProjectSeo(base, { variant }).headline));
    expect(headlines.size).toBeGreaterThanOrEqual(3);
  });

  it("falls back to a shorter area instead of exceeding the limit", () => {
    const r = buildProjectSeo(
      { ...base, systems: ["giau-tran-noi-ong-gio", "cap-khi-tuoi-thu-hoi-nhiet"], brands: ["Daikin", "Menred"], district: "Quận Bình Thạnh" },
      { variant: 2 },
    );
    expect(r.metaTitle.length).toBeLessThanOrEqual(META_TITLE_MAX);
    expect(r.headline.length).toBeLessThanOrEqual(HEADLINE_MAX);
  });

  it("does not repeat the province when the district already contains it", () => {
    const r = buildProjectSeo({ ...base, province: "Vĩnh Long", district: "TP. Vĩnh Long" });
    expect(r.metaDescription).not.toContain("Vĩnh Long, Vĩnh Long");
  });

  it("works without area (area unknown) and without brand", () => {
    const r = buildProjectSeo({ typeSlug: "vui-choi-giai-tri", systems: ["cassette-am-tran"], brands: [] });
    expect(r.headline).not.toMatch(/tại\s*$/);
    expect(r.metaTitle.length).toBeGreaterThan(0);
  });

  it("detail level adds the completion year so two similar projects can differ", () => {
    const a = buildProjectSeo(base, { detail: 0 });
    const b = buildProjectSeo(base, { detail: 1 });
    expect(b.headline).toContain("2024");
    expect(a.headline).not.toContain("2024");
  });

  it("puts the product first, never uses \"cho\", and prefers the specific venue kind", () => {
    for (let variant = 0; variant < 4; variant++) {
      const r = buildProjectSeo({ ...base, typeSlug: "co-so-kinh-doanh", venueKind: "shop thời trang" }, { variant });
      expect(r.headline).not.toMatch(/\bcho\b/);
      expect(r.metaTitle).not.toMatch(/\bcho\b/);
      expect(r.metaTitle).toContain("shop thời trang");
      expect(r.metaTitle).not.toContain("cơ sở kinh doanh");
      expect(r.metaTitle.toLowerCase().indexOf("máy lạnh")).toBeLessThan(r.metaTitle.indexOf("shop thời trang"));
    }
  });

  it("keeps the area by shortening the system phrase instead of cutting the title mid-word", () => {
    const r = buildProjectSeo({
      typeSlug: "cong-trinh-cong-nghiep",
      systems: ["cap-khi-tuoi-thu-hoi-nhiet"],
      brands: [],
      province: "Bà Rịa - Vũng Tàu",
      district: "Thị xã Phú Mỹ",
    });
    expect(r.metaTitle).toContain("Phú Mỹ");
    expect(r.metaTitle.length).toBeLessThanOrEqual(META_TITLE_MAX);
  });

  it("variantOf is stable and within range", () => {
    expect(variantOf("abc")).toBe(variantOf("abc"));
    expect(variantOf("abc")).toBeGreaterThanOrEqual(0);
    expect(variantOf("abc")).toBeLessThan(4);
  });
});
