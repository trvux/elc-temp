import { describe, expect, it } from "vitest";
import { computeLeadPriority } from "../lead-priority";
import type { Inquiry } from "../types";

const lead = (leadType: Inquiry["leadType"], qualifyData: Record<string, string>) =>
  ({ leadType, qualifyData }) as unknown as Inquiry;

describe("computeLeadPriority: service leads from the current form", () => {
  it("marks a rush request on an existing unit (dich-vu line, within 2 hours) as Hỏa tốc", () => {
    expect(computeLeadPriority(lead("service", { line: "dich-vu", urgency: "gap-1-2-gio" }))?.label).toBe("Hỏa tốc");
  });

  it("does not mark a system installation as Hỏa tốc even if urgency is set", () => {
    expect(computeLeadPriority(lead("service", { line: "thi-cong", urgency: "gap-1-2-gio" }))).toBeNull();
  });

  it("still marks a legacy repair lead as Hỏa tốc", () => {
    expect(computeLeadPriority(lead("service", { supportType: "repair", urgency: "gap-1-2-gio" }))?.label).toBe("Hỏa tốc");
  });

  it("flags a lead that answered every brief prompt as ready to quote", () => {
    expect(computeLeadPriority(lead("service", { line: "thi-cong", briefAnswered: "5", briefTotal: "5" }))?.label).toBe(
      "Đủ thông tin báo giá",
    );
  });

  it("does not flag a partial or empty brief", () => {
    expect(computeLeadPriority(lead("service", { line: "thi-cong", briefAnswered: "2", briefTotal: "5" }))).toBeNull();
    expect(computeLeadPriority(lead("service", { line: "thi-cong" }))).toBeNull();
  });
});
