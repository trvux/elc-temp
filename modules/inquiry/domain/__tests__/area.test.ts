import { describe, expect, it } from "vitest";
import { areaBand, parseAreaM2 } from "../area";

describe("parseAreaM2", () => {
  it.each([
    ["400m2", 400],
    ["400 m2", 400],
    ["400m²", 400],
    ["100 mét vuông", 100],
    ["3 tầng, 400m2", 400],
    ["1.200 m²", 1200],
    ["1,200 m2", 1200],
    ["12,5 m2", 12.5],
    ["3 tầng x 400m2 = 1200m2", 1200],
  ])("reads %s as %s", (text, expected) => {
    expect(parseAreaM2(text)).toBe(expected);
  });

  it("returns null when there is no area in the text", () => {
    expect(parseAreaM2("3 tầng")).toBeNull();
    expect(parseAreaM2("")).toBeNull();
    expect(parseAreaM2("khoảng 400")).toBeNull();
  });
});

describe("areaBand", () => {
  it("uses the same bands as the old scale question", () => {
    expect(areaBand(150)).toBe("<200m2");
    expect(areaBand(200)).toBe("200-500m2");
    expect(areaBand(499)).toBe("200-500m2");
    expect(areaBand(500)).toBe("500-1000m2");
    expect(areaBand(1000)).toBe("500-1000m2");
    expect(areaBand(1001)).toBe(">1000m2");
  });
});
