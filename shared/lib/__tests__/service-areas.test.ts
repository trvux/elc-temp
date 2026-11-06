import { describe, expect, it } from "vitest";

import { isServiceAreaProvince, SERVICE_AREA_GROUPS, SERVICE_AREA_PROVINCES } from "../service-areas";

describe("service areas", () => {
  it("offers every province once", () => {
    expect(new Set(SERVICE_AREA_PROVINCES).size).toBe(SERVICE_AREA_PROVINCES.length);
    expect(SERVICE_AREA_PROVINCES).toHaveLength(14);
  });

  it("every former province name in the JSON-LD is reachable from a chip (or is a known alias)", () => {
    const aliases = new Set(["Phú Quốc"]); // an island inside An Giang, not a province to pick
    for (const group of SERVICE_AREA_GROUPS) {
      for (const name of group.alternateName) {
        if (aliases.has(name)) continue;
        expect(group.provinces, `${name} in ${group.name}`).toContain(name);
      }
      expect(group.provinces.length).toBeGreaterThan(0);
    }
  });

  it("recognises a chip and nothing else", () => {
    expect(isServiceAreaProvince("Bình Dương")).toBe(true);
    expect(isServiceAreaProvince("Hà Nội")).toBe(false);
    expect(isServiceAreaProvince("bình dương")).toBe(false);
  });
});
