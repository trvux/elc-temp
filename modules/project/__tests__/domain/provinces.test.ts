import { describe, expect, it } from "vitest";
import { PROVINCES, currentProvinceFor, isProvince, provinceLabel } from "../../domain/provinces";

describe("provinces (34 units since 2025-07-01)", () => {
  it("has exactly 34 unique names and codes: 28 provinces + 6 cities", () => {
    expect(PROVINCES).toHaveLength(34);
    expect(new Set(PROVINCES.map((p) => p.name)).size).toBe(34);
    expect(new Set(PROVINCES.map((p) => p.code)).size).toBe(34);
    expect(PROVINCES.filter((p) => p.kind === "city")).toHaveLength(6);
  });

  it("accounts for all 63 pre-merger provinces (34 current + 29 absorbed names)", () => {
    const absorbed = PROVINCES.flatMap((p) => p.mergedFrom);
    // 63 - 34 = 29 provinces disappeared into another unit
    expect(absorbed).toHaveLength(29);
    expect(new Set(absorbed).size).toBe(29);
  });

  it("maps pre-merger names from the real articles to the current province", () => {
    expect(currentProvinceFor("Bà Rịa – Vũng Tàu")).toBe("Hồ Chí Minh");
    expect(currentProvinceFor("Bà Rịa - Vũng Tàu")).toBe("Hồ Chí Minh");
    expect(currentProvinceFor("Tỉnh Bình Dương")).toBe("Hồ Chí Minh");
    expect(currentProvinceFor("Long An")).toBe("Tây Ninh");
    expect(currentProvinceFor("Kiên Giang")).toBe("An Giang");
    expect(currentProvinceFor("kien giang")).toBe("An Giang");
    expect(currentProvinceFor("TP. Hồ Chí Minh")).toBe("Hồ Chí Minh");
    expect(currentProvinceFor("TP.HCM")).toBe("Hồ Chí Minh");
    expect(currentProvinceFor("Hà Nội")).toBe("Hà Nội");
  });

  it("returns null for anything it does not know (never guesses)", () => {
    expect(currentProvinceFor("Chuỗi thương hiệu cà phê cao cấp")).toBeNull();
    expect(currentProvinceFor("")).toBeNull();
  });

  it("validates and labels", () => {
    expect(isProvince("Hồ Chí Minh")).toBe(true);
    expect(isProvince("Bình Dương")).toBe(false); // pre-merger: not a storable value
    expect(provinceLabel("Hồ Chí Minh")).toBe("TP. Hồ Chí Minh");
    expect(provinceLabel("Hà Nội")).toBe("Hà Nội");
    expect(provinceLabel("Lâm Đồng")).toBe("Lâm Đồng");
  });
});
