import { afterEach, describe, expect, it, vi } from "vitest";

import { uploadInquiryFile } from "../upload-file";

class FakeXHR {
  static last: FakeXHR;
  upload: { onprogress?: (e: { lengthComputable: boolean; loaded: number; total: number }) => void } = {};
  onload?: () => void;
  onerror?: () => void;
  ontimeout?: () => void;
  onabort?: () => void;
  status = 0;
  responseText = "";
  method = "";
  url = "";
  sent?: FormData;
  constructor() {
    FakeXHR.last = this;
  }
  open(method: string, url: string) {
    this.method = method;
    this.url = url;
  }
  send(body: FormData) {
    this.sent = body;
  }
  abort() {
    this.onabort?.();
  }
  respond(status: number, body: string) {
    this.status = status;
    this.responseText = body;
    this.onload?.();
  }
}

afterEach(() => vi.unstubAllGlobals());

function start() {
  vi.stubGlobal("XMLHttpRequest", FakeXHR);
  const progress: number[] = [];
  const handle = uploadInquiryFile(new File(["%PDF-1.7"], "ban ve.pdf", { type: "application/pdf" }), (p) => progress.push(p));
  return { handle, progress, xhr: FakeXHR.last };
}

describe("uploadInquiryFile", () => {
  it("posts the file as multipart to the upload route and returns what was stored", async () => {
    const { handle, xhr, progress } = start();
    expect(xhr.method).toBe("POST");
    expect(xhr.url).toBe("/api/inquiries/files");
    expect((xhr.sent?.get("file") as File).name).toBe("ban ve.pdf");
    xhr.upload.onprogress?.({ lengthComputable: true, loaded: 50, total: 100 });
    xhr.respond(200, JSON.stringify({ key: "inquiries/202611/ab.pdf", name: "ban ve.pdf", size: 8, type: "application/pdf" }));
    expect(await handle.promise).toEqual({ ok: true, file: { key: "inquiries/202611/ab.pdf", name: "ban ve.pdf", size: 8, type: "application/pdf" } });
    expect(progress).toEqual([50, 100]);
  });

  it("never reports 100% before the server has answered", () => {
    const { xhr, progress } = start();
    xhr.upload.onprogress?.({ lengthComputable: true, loaded: 100, total: 100 });
    expect(progress).toEqual([99]);
  });

  it.each([
    [413, "{}", "15 MB", true],
    [429, "{}", "Zalo", true],
    [400, JSON.stringify({ fields: { file: ["file must be 15 MB or smaller"] } }), "15 MB", true],
    [400, JSON.stringify({ fields: { file: ["only PDF, DWG, DXF, JPG, PNG and WebP files are accepted"] } }), "PDF, DWG, DXF", false],
    [500, "{}", "Zalo", true],
    [410, "<html>410 Gone</html>", "Zalo", true],
  ])("status %i gets a Vietnamese message that never shows markup", async (status, body, expected, zalo) => {
    const { handle, xhr } = start();
    xhr.respond(status, body);
    const result = await handle.promise;
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain(expected);
      expect(result.message).not.toContain("<");
      expect(result.suggestZalo).toBe(zalo);
    }
  });

  it("explains a dropped connection", async () => {
    const { handle, xhr } = start();
    xhr.onerror?.();
    const result = await handle.promise;
    expect(result).toMatchObject({ ok: false });
    if (!result.ok) expect(result.message).toContain("kết nối");
  });

  it("resolves quietly when the visitor removes a file mid-upload", async () => {
    const { handle } = start();
    handle.abort();
    expect(await handle.promise).toEqual({ ok: false, message: "", suggestZalo: false });
  });

  it("treats a 200 that is not our JSON as a failure", async () => {
    const { handle, xhr } = start();
    xhr.respond(200, "<html>captive portal</html>");
    expect((await handle.promise).ok).toBe(false);
  });
});
