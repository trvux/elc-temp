import { describe, expect, it } from "vitest";
import { DIRECTOR, getDirectorSchema } from "../../domain/director";
import { BASE_URL } from "@/shared/lib/seo-schema";

describe("director schema", () => {
  it("is a Person that works for the site-wide Organization", () => {
    const s = getDirectorSchema();
    expect(s["@type"]).toBe("Person");
    expect(s.name).toBe("Nguyễn Hữu Thấu");
    expect(s.jobTitle).toBe("Giám đốc");
    expect(s.worksFor["@id"]).toBe(`${BASE_URL}/#organization`);
  });

  it("uses an absolute image URL that points at the avatar file", () => {
    expect(getDirectorSchema().image).toBe(`${BASE_URL}${DIRECTOR.photo}`);
    expect(DIRECTOR.photo.startsWith("/images/team/")).toBe(true);
  });

  it("claims no degree or years of experience (unverified)", () => {
    const text = JSON.stringify({ ...DIRECTOR, schema: getDirectorSchema() }).toLowerCase();
    expect(text).not.toMatch(/tiến sĩ|phd|\bts\.|năm kinh nghiệm/);
  });
});
