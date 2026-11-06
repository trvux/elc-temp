import { describe, expect, it } from "vitest";

import {
  briefKeyFromLabel,
  briefLabels,
  cleanBriefFieldsForSave,
  effectiveBriefFields,
  parseBriefFields,
} from "../brief-fields";

describe("briefKeyFromLabel (same cases as elc-go's BriefKeyFromLabel)", () => {
  it.each([
    ["Số phòng cần làm lạnh", "so_phong_can_lam_lanh"],
    ["Diện tích (m²)", "dien_tich_m"],
    ["Đã có bản vẽ mặt bằng chưa?", "da_co_ban_ve_mat_bang_chua"],
    ["  Loại   công trình  ", "loai_cong_trinh"],
    ["???", ""],
  ])("%s -> %s", (label, key) => {
    expect(briefKeyFromLabel(label)).toBe(key);
  });
});

describe("effectiveBriefFields", () => {
  it("uses the typed fields when there are any", () => {
    const typed = [{ key: "area_m2", label: "Diện tích", kind: "area" as const }];
    expect(effectiveBriefFields(typed, ["Địa chỉ"])).toBe(typed);
  });

  it("falls back to the old prompts as text fields with unique keys", () => {
    const fields = effectiveBriefFields([], ["Địa chỉ", " Dia chi ", "", "Số máy"]);
    expect(fields.map((f) => [f.key, f.label, f.kind])).toEqual([
      ["dia_chi", "Địa chỉ", "text"],
      ["dia_chi_2", "Dia chi", "text"],
      ["so_may", "Số máy", "text"],
    ]);
    expect(briefLabels(fields)).toEqual(["Địa chỉ", "Dia chi", "Số máy"]);
  });

  it("is empty when there is nothing at all", () => {
    expect(effectiveBriefFields([], [])).toEqual([]);
  });
});

describe("parseBriefFields", () => {
  it("keeps valid rows and drops malformed ones", () => {
    const parsed = parseBriefFields([
      { key: "so_tang", label: "Số tầng", kind: "number", unit: "tầng" },
      { key: "x", label: "  ", kind: "text" },
      { label: "no key", kind: "text" },
      null,
      { key: "loai", label: "Loại", kind: "choice", options: ["A", 3, "B"] },
      { key: "k", label: "Lạ", kind: "slider" },
    ]);
    expect(parsed).toEqual([
      { key: "so_tang", label: "Số tầng", kind: "number", unit: "tầng" },
      { key: "loai", label: "Loại", kind: "choice", options: ["A", "B"] },
      { key: "k", label: "Lạ", kind: "text" },
    ]);
  });

  it("returns [] for a null or non-array value", () => {
    expect(parseBriefFields(null)).toEqual([]);
    expect(parseBriefFields({})).toEqual([]);
  });
});

describe("cleanBriefFieldsForSave", () => {
  it("drops blank rows, derives missing keys and keeps extras only where they apply", () => {
    const cleaned = cleanBriefFieldsForSave([
      { key: "", label: " Số phòng ", kind: "number", unit: " phòng " },
      { key: "", label: "   ", kind: "text" },
      { key: "ct", label: "Loại công trình", kind: "choice", options: [" Nhà phố ", "Nhà phố", "", "Biệt thự"] },
      { key: "", label: "Ghi chú", kind: "text", unit: "x", options: ["a"] },
    ]);
    expect(cleaned).toEqual([
      { key: "so_phong", label: "Số phòng", kind: "number", unit: "phòng" },
      { key: "ct", label: "Loại công trình", kind: "choice", options: ["Nhà phố", "Biệt thự"] },
      { key: "ghi_chu", label: "Ghi chú", kind: "text" },
    ]);
  });
});
