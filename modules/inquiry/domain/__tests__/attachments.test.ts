import { describe, expect, it } from "vitest";

import { checkNewFile, fileKind, formatFileSize, MAX_FILE_BYTES, MAX_FILES, MAX_TOTAL_BYTES } from "../attachments";

const MB = 1024 * 1024;

describe("checkNewFile", () => {
  it.each(["ban-ve.pdf", "TANG1.DWG", "mat-bang.dxf", "a.jpg", "a.JPEG", "a.png", "a.webp"])("accepts %s", (name) => {
    expect(checkNewFile({ name, size: 1000 }, [])).toEqual({ ok: true });
  });

  it.each(["a.zip", "a.rar", "a.exe", "a.docx", "a.svg", "a.heic", "noextension", "a.pdf.exe"])("rejects %s by type", (name) => {
    const r = checkNewFile({ name, size: 1000 }, []);
    expect(r).toMatchObject({ ok: false, reason: "type", suggestZalo: false });
  });

  it("rejects an empty file", () => {
    expect(checkNewFile({ name: "a.pdf", size: 0 }, [])).toMatchObject({ ok: false, reason: "empty" });
  });

  it("allows exactly 15 MB and refuses one byte more, pointing at Zalo", () => {
    expect(checkNewFile({ name: "a.pdf", size: MAX_FILE_BYTES }, [])).toEqual({ ok: true });
    const r = checkNewFile({ name: "a.pdf", size: MAX_FILE_BYTES + 1 }, []);
    expect(r).toMatchObject({ ok: false, reason: "too-large", suggestZalo: true });
    if (!r.ok) expect(r.message).toContain("Zalo");
  });

  it("allows six files and refuses the seventh", () => {
    const six = Array.from({ length: MAX_FILES }, () => ({ size: 10 }));
    expect(checkNewFile({ name: "a.pdf", size: 10 }, six.slice(0, 5))).toEqual({ ok: true });
    expect(checkNewFile({ name: "a.pdf", size: 10 }, six)).toMatchObject({ ok: false, reason: "too-many", suggestZalo: true });
  });

  it("keeps the whole lead within 30 MB", () => {
    expect(checkNewFile({ name: "b.pdf", size: 15 * MB }, [{ size: 15 * MB }])).toEqual({ ok: true });
    expect(checkNewFile({ name: "b.pdf", size: 15 * MB + 1 }, [{ size: 15 * MB }])).toMatchObject({ ok: false });
    expect(checkNewFile({ name: "b.pdf", size: 1 }, [{ size: MAX_TOTAL_BYTES }])).toMatchObject({ ok: false, reason: "total-too-large" });
  });
});

describe("fileKind", () => {
  it("tells images, PDFs and drawings apart by type or by name", () => {
    expect(fileKind({ name: "a.jpg", type: "image/jpeg" })).toBe("image");
    expect(fileKind({ name: "a.webp" })).toBe("image");
    expect(fileKind({ name: "a.pdf", type: "application/pdf" })).toBe("pdf");
    expect(fileKind({ name: "a.dwg", type: "image/vnd.dwg" })).toBe("cad");
    expect(fileKind({ name: "a.dxf" })).toBe("cad");
    expect(fileKind({ name: "a.zip" })).toBe("other");
  });
});

describe("formatFileSize", () => {
  it.each([
    [0, "0 B"],
    [900, "900 B"],
    [850 * 1024, "850 KB"],
    [2.3 * MB, "2,3 MB"],
    [15 * MB, "15 MB"],
  ])("%d -> %s", (bytes, text) => {
    expect(formatFileSize(bytes)).toBe(text);
  });
});
