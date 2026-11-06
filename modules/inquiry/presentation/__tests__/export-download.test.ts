import { afterEach, describe, expect, it, vi } from "vitest";

import { downloadInquiryExport } from "../export-download";

function respond(status: number, body: string, contentType: string) {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(body, { status, headers: { "Content-Type": contentType } })));
}

afterEach(() => vi.unstubAllGlobals());

describe("downloadInquiryExport failures", () => {
  it("shows our own plain-text reason", async () => {
    respond(403, "Chỉ quản trị viên được xuất dữ liệu khách hàng.", "text/plain; charset=utf-8");
    expect(await downloadInquiryExport({})).toEqual({ ok: false, error: "Chỉ quản trị viên được xuất dữ liệu khách hàng." });
  });

  it("never shows a proxy's HTML error page", async () => {
    respond(410, "<html><head><title>410 Gone</title></head></html>", "text/html");
    const result = await downloadInquiryExport({});
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).not.toContain("<");
      expect(result.error).toContain("410");
    }
  });

  it("reports an unreachable server", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));
    expect(await downloadInquiryExport({})).toEqual({ ok: false, error: "Không kết nối được máy chủ." });
  });
});
