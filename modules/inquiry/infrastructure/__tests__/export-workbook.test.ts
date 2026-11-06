import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";

import type { Inquiry } from "../../domain";
import { buildInquiryWorkbook } from "../export-workbook";

const lead = (patch: Partial<Inquiry>): Inquiry => ({
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
  qualifyData: { khuVuc: "TP.HCM", brief: "Địa chỉ: Q7\nSố tầng: 3" },
  interestHistory: [{ entityName: "Daikin", pagePath: "/san-pham/daikin", at: "2026-11-06T03:00:00Z" }],
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
  conversionValue: 15000000,
  adsConversionSyncedAt: null,
  createdAt: "2026-11-06T03:15:00Z",
  updatedAt: "2026-11-06T04:00:00Z",
  ...patch,
});

async function read(buf: Buffer) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf as unknown as ArrayBuffer);
  return wb;
}

describe("buildInquiryWorkbook (round-tripped through a real .xlsx)", () => {
  it("has the two sheets with a header row and one row per lead / click", async () => {
    const wb = await read(await buildInquiryWorkbook([lead({}), lead({ id: "2", interestHistory: [] })]));
    expect(wb.worksheets.map((w) => w.name)).toEqual(["Khách hàng", "Lịch sử quan tâm"]);
    expect(wb.getWorksheet("Khách hàng")!.rowCount).toBe(3);
    expect(wb.getWorksheet("Lịch sử quan tâm")!.rowCount).toBe(2);
  });

  it("keeps the phone as text with its leading zero and the date as a real date", async () => {
    const sheet = (await read(await buildInquiryWorkbook([lead({})]))).getWorksheet("Khách hàng")!;
    const phone = sheet.getRow(2).getCell(3);
    expect(phone.value).toBe("0912345678");
    expect(phone.type).toBe(ExcelJS.ValueType.String);
    const sent = sheet.getRow(2).getCell(1);
    expect(sent.value).toBeInstanceOf(Date);
    expect(sheet.getRow(2).getCell(15).value).toBe(15000000);
  });

  it("stores a formula-looking customer input as plain text", async () => {
    const evil = '=HYPERLINK("http://evil","click")';
    const sheet = (await read(await buildInquiryWorkbook([lead({ name: evil, message: "+1+1" })]))).getWorksheet("Khách hàng")!;
    const name = sheet.getRow(2).getCell(2);
    expect(name.type).toBe(ExcelJS.ValueType.String);
    expect(name.value).toBe(evil);
    expect(name.formula).toBeUndefined();
  });

  it("produces a valid workbook for an empty selection", async () => {
    const wb = await read(await buildInquiryWorkbook([]));
    expect(wb.getWorksheet("Khách hàng")!.rowCount).toBe(1);
  });
});
