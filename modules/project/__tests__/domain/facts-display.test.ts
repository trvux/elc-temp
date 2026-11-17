import { describe, expect, it } from "vitest";
import { buildFactRows, formatCompleted, hasTypedFacts } from "../../domain/facts-display";
import { EMPTY_FACTS, projectCondition, type ProjectFacts } from "../../domain/types";

const facts = (over: Partial<ProjectFacts> = {}): ProjectFacts => ({ ...EMPTY_FACTS, ...over });
const base = { completedAt: null as string | null, services: [], categories: [], clientName: "" };

describe("formatCompleted", () => {
  it("prints only the precision that is known", () => {
    expect(formatCompleted("2025-07-15T00:00:00Z", "day")).toBe("15/07/2025");
    expect(formatCompleted("2025-07-01T00:00:00Z", "month")).toBe("Tháng 07/2025");
    expect(formatCompleted("2022-01-01T00:00:00Z", "year")).toBe("Năm 2022");
  });
  it("prints nothing for unknown precision or a missing date", () => {
    expect(formatCompleted("2025-07-15T00:00:00Z", "unknown")).toBeNull();
    expect(formatCompleted(null, "day")).toBeNull();
  });
  it("does not shift the day across timezones", () => {
    expect(formatCompleted("2025-12-31T00:00:00Z", "day")).toBe("31/12/2025");
  });
});

describe("projectCondition", () => {
  it("derives new / used / mixed from project_category", () => {
    expect(projectCondition([])).toBeNull();
    expect(projectCondition([{ condition: "new" }])).toBe("new");
    expect(projectCondition([{ condition: "used" }, { condition: "used" }])).toBe("used");
    expect(projectCondition([{ condition: "new" }, { condition: "used" }])).toBe("mixed");
  });
});

describe("buildFactRows", () => {
  it("yields no rows (and no placeholders) when nothing is known", () => {
    expect(buildFactRows({ ...base, facts: facts() })).toEqual([]);
    expect(hasTypedFacts(facts())).toBe(false);
  });

  it("builds fixed labels in a fixed order and skips null facts", () => {
    const rows = buildFactRows({
      completedAt: "2025-07-15T00:00:00Z",
      clientName: "",
      services: [{ id: "1", title: "Điều hòa VRV", slug: "vrv" }, { id: "2", title: "Cấp khí tươi", slug: "kt" }],
      categories: [{ id: "c", name: "n", slug: "s", groupId: null, condition: "used" }],
      facts: facts({
        province: "Hồ Chí Minh",
        ward: "Phường Tân Phú",
        completedPrecision: "day",
        brands: ["Daikin", "Menred"],
        indoorUnits: 6,
        capacityHp: 12.5,
      }),
    });
    expect(rows.map((r) => r.label)).toEqual([
      "Địa điểm",
      "Hoàn thành",
      "Hệ thống",
      "Thiết bị",
      "Tình trạng thiết bị",
      "Số dàn lạnh / cửa gió",
      "Tổng công suất",
    ]);
    const byLabel = Object.fromEntries(rows.map((r) => [r.label, r.value]));
    expect(byLabel["Địa điểm"]).toBe("Phường Tân Phú, TP. Hồ Chí Minh");
    expect(byLabel["Tình trạng thiết bị"]).toBe("Thiết bị qua sử dụng");
    expect(byLabel["Tổng công suất"]).toBe("12,5 HP");
    expect(rows.some((r) => /cập nhật/i.test(r.value))).toBe(false);
  });

  it("shows the client only when the API let the name through", () => {
    const withName = buildFactRows({ ...base, clientName: "Công ty ABC", facts: facts({ province: "Hà Nội" }) });
    expect(withName.find((r) => r.label === "Chủ đầu tư")?.value).toBe("Công ty ABC");
    const masked = buildFactRows({ ...base, clientName: "", facts: facts({ province: "Hà Nội" }) });
    expect(masked.find((r) => r.label === "Chủ đầu tư")).toBeUndefined();
  });
});
