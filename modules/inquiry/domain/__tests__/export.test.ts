import { describe, expect, it } from "vitest";
import { buildHistoryTable, buildLeadTable, exportFileName, formatQualifyLines } from "../export";
import type { Inquiry } from "../types";

const base: Inquiry = {
  id: "1",
  name: "Nguyễn An",
  phone: "0912345678",
  email: null,
  message: null,
  productId: null,
  projectId: null,
  serviceId: null,
  leadType: "service",
  subType: null,
  qualifyData: {},
  interestHistory: [],
  attachments: [],
  channel: "form",
  gclid: null,
  utmSource: null,
  utmMedium: null,
  utmCampaign: null,
  utmTerm: null,
  utmContent: null,
  gaClientId: null,
  status: "new",
  internalNote: null,
  conversionValue: null,
  adsConversionSyncedAt: null,
  createdAt: "2026-11-06T03:15:00Z",
  updatedAt: "2026-11-06T04:00:00Z",
};
const lead = (patch: Partial<Inquiry>): Inquiry => ({ ...base, ...patch });

function row(inquiry: Inquiry) {
  const table = buildLeadTable([inquiry]);
  const byHeader = (h: string) => table.rows[0][table.columns.findIndex((c) => c.header === h)];
  return { table, byHeader };
}

describe("buildLeadTable", () => {
  it("keeps one cell per column, in the header order", () => {
    const { table } = row(base);
    expect(table.rows[0]).toHaveLength(table.columns.length);
  });

  it("keeps the phone as text so the leading 0 survives", () => {
    expect(row(base).byHeader("Số điện thoại")).toBe("0912345678");
  });

  it("writes the send time as a real Date, not a locale string", () => {
    const sent = row(base).byHeader("Ngày gửi");
    expect(sent).toBeInstanceOf(Date);
    expect((sent as Date).toISOString()).toBe("2026-11-06T03:15:00.000Z");
  });

  it("uses the Vietnamese labels the admin table uses", () => {
    const r = row(lead({ channel: "zalo", leadType: "product", status: "contacted" }));
    expect(r.byHeader("Kênh")).toBe("Zalo");
    expect(r.byHeader("Loại")).toBe("Sản phẩm");
    expect(r.byHeader("Trạng thái")).toBe("Đã liên hệ");
  });

  it("carries the lead priority badge", () => {
    const r = row(lead({ qualifyData: { line: "dich-vu", urgency: "gap-1-2-gio" } }));
    expect(r.byHeader("Ưu tiên")).toBe("Hỏa tốc");
    expect(row(base).byHeader("Ưu tiên")).toBe("");
  });

  it("prefers the page entity, then the chosen service, then the first click for Quan tâm", () => {
    expect(row(lead({ qualifyData: { entityName: "Daikin FTKB", service: "Vệ sinh" } })).byHeader("Quan tâm")).toBe("Daikin FTKB");
    expect(row(lead({ qualifyData: { service: "Vệ sinh bảo trì" } })).byHeader("Quan tâm")).toBe("Vệ sinh bảo trì");
    expect(
      row(lead({ interestHistory: [{ at: "2026-11-06T03:00:00Z" }, { entityName: "Menred NET.800", at: "2026-11-06T03:01:00Z" }] })).byHeader("Quan tâm"),
    ).toBe("Menred NET.800");
  });

  it("puts the region in its own column and leaves it out of the survey text", () => {
    const r = row(lead({ qualifyData: { khuVuc: "TP.HCM", urgency: "gap-1-2-gio" } }));
    expect(r.byHeader("Khu vực")).toBe("TP.HCM");
    expect(r.byHeader("Thông tin khảo sát")).not.toContain("Khu vực");
  });

  it("lists attachments one per line and leaves the order value empty when unset", () => {
    const r = row(lead({ attachments: ["https://a/1.jpg", "https://a/2.jpg"] }));
    expect(r.byHeader("Tệp đính kèm")).toBe("https://a/1.jpg\nhttps://a/2.jpg");
    expect(r.byHeader("Giá trị đơn (VNĐ)")).toBeNull();
    expect(row(lead({ conversionValue: 15000000 })).byHeader("Giá trị đơn (VNĐ)")).toBe(15000000);
  });

  it("does not choke on an unparseable date", () => {
    expect(row(lead({ createdAt: "garbage" })).byHeader("Ngày gửi")).toBeNull();
  });

  it("returns only the header row's worth of columns for an empty list", () => {
    const table = buildLeadTable([]);
    expect(table.rows).toEqual([]);
    expect(table.columns.length).toBeGreaterThan(10);
  });
});

describe("formatQualifyLines", () => {
  it("shows label and decoded value per line and skips empty answers", () => {
    const text = formatQualifyLines({ line: "thi-cong", brief: "Địa chỉ: Q7\nSố tầng: 3", urgency: "" });
    expect(text).toContain("Mảng dịch vụ: Thi công hệ thống");
    expect(text).toContain("Thông tin khách cung cấp: Địa chỉ: Q7\nSố tầng: 3");
    expect(text).not.toContain("Thời gian mong muốn");
  });

  it("leaves out bookkeeping keys and puts the multi-line brief last", () => {
    const text = formatQualifyLines({
      brief: "Địa chỉ: Q7",
      briefAnswered: "1",
      briefTotal: "3",
      serviceSlug: "ve-sinh",
      urgency: "gap-1-2-gio",
      line: "dich-vu",
    });
    expect(text).not.toMatch(/Số mục đã điền|Tổng số mục|Trang dịch vụ/);
    expect(text.split("\n").at(-1)).toBe("Thông tin khách cung cấp: Địa chỉ: Q7");
  });

  it("falls back to the raw key for a key without a label", () => {
    expect(formatQualifyLines({ somethingNew: "x" })).toBe("somethingNew: x");
  });
});

describe("buildHistoryTable", () => {
  it("makes one row per click, repeating who the lead is", () => {
    const table = buildHistoryTable([
      lead({
        interestHistory: [
          { entityName: "Daikin", pagePath: "/san-pham/daikin", at: "2026-11-06T03:00:00Z" },
          { at: "2026-11-06T03:05:00Z" },
        ],
      }),
      lead({ id: "2", name: "Không click" }),
    ]);
    expect(table.rows).toHaveLength(2);
    expect(table.rows[0][0]).toBe("Nguyễn An");
    expect(table.rows[0][4]).toBe("Daikin");
    expect(table.rows[1][4]).toBe("Liên hệ chung (không gắn sản phẩm/dịch vụ)");
    expect(table.rows[0]).toHaveLength(table.columns.length);
  });
});

describe("exportFileName", () => {
  it("names the file with the Vietnam wall-clock time", () => {
    // 2026-11-06 20:30 UTC is already 03:30 on the 7th in Vietnam.
    expect(exportFileName(new Date("2026-11-06T20:30:00Z"))).toBe("lead-20261107-0330.xlsx");
  });
});
