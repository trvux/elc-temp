import ExcelJS from "exceljs";

import { buildHistoryTable, buildLeadTable, type ExportTable, type Inquiry } from "../domain";

function addSheet(workbook: ExcelJS.Workbook, name: string, table: ExportTable) {
  const sheet = workbook.addWorksheet(name, { views: [{ state: "frozen", ySplit: 1 }] });

  sheet.columns = table.columns.map((c) => ({
    header: c.header,
    width: c.width,
    style: {
      ...(c.numFmt ? { numFmt: c.numFmt } : {}),
      alignment: { vertical: "top", wrapText: c.wrap ?? false },
    },
  }));
  // A string cell stays a string in Excel (it is never parsed as a formula), so
  // a customer typing "=HYPERLINK(...)" as their name is shown as text, not run.
  table.rows.forEach((row) => sheet.addRow(row));

  const header = sheet.getRow(1);
  header.font = { bold: true };
  header.alignment = { vertical: "middle", wrapText: true };
  header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEFEFEF" } };

  if (table.columns.length > 0) {
    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: table.columns.length },
    };
  }
  return sheet;
}

/** Sheet 1: one row per lead. Sheet 2: one row per click in each lead's interest history. */
export async function buildInquiryWorkbook(inquiries: Inquiry[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.created = new Date();

  addSheet(workbook, "Khách hàng", buildLeadTable(inquiries));
  addSheet(workbook, "Lịch sử quan tâm", buildHistoryTable(inquiries));

  return Buffer.from(await workbook.xlsx.writeBuffer());
}
