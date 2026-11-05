import { describe, expect, it } from "vitest";
import { SERVICE_LINES, SERVICE_LINE_ORDER, groupServicesByLine, normalizeServiceLine } from "../line";

describe("normalizeServiceLine", () => {
  it("keeps thi-cong and treats everything else as a regular service", () => {
    expect(normalizeServiceLine("thi-cong")).toBe("thi-cong");
    expect(normalizeServiceLine("dich-vu")).toBe("dich-vu");
    expect(normalizeServiceLine("khac")).toBe("dich-vu");
    expect(normalizeServiceLine(null)).toBe("dich-vu");
    expect(normalizeServiceLine(undefined)).toBe("dich-vu");
  });
});

describe("groupServicesByLine", () => {
  const svc = (id: string, line: "thi-cong" | "dich-vu") => ({ id, line });

  it("orders the sections main business first and keeps order inside a section", () => {
    const out = groupServicesByLine([svc("a", "dich-vu"), svc("b", "thi-cong"), svc("c", "dich-vu"), svc("d", "thi-cong")]);
    expect(out.map((s) => s.line)).toEqual(["thi-cong", "dich-vu"]);
    expect(out[0].services.map((s) => s.id)).toEqual(["b", "d"]);
    expect(out[1].services.map((s) => s.id)).toEqual(["a", "c"]);
  });

  it("leaves out a line that has no service", () => {
    expect(groupServicesByLine([svc("a", "dich-vu")]).map((s) => s.line)).toEqual(["dich-vu"]);
    expect(groupServicesByLine([])).toEqual([]);
  });
});

describe("SERVICE_LINES", () => {
  it("has complete copy for every line in the hub order", () => {
    for (const line of SERVICE_LINE_ORDER) {
      const info = SERVICE_LINES[line];
      expect(Object.values(info).every((v) => v.trim().length > 0)).toBe(true);
    }
  });
});
