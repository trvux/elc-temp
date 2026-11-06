import type { UploadedFile } from "../domain/attachments";

export type UploadResult = { ok: true; file: UploadedFile } | { ok: false; message: string; suggestZalo: boolean };

export interface UploadHandle {
  promise: Promise<UploadResult>;
  abort: () => void;
}

const NETWORK_MESSAGE = "Mất kết nối khi tải tệp lên. Kiểm tra mạng rồi thử lại.";

// What the visitor reads when a status code comes back. elc-go's own reason wins when it
// sent one (it names the exact problem: wrong type, too big); the fallbacks cover a proxy
// or Cloudflare answering with a page instead of JSON.
function messageFor(status: number, body: unknown): { message: string; suggestZalo: boolean } {
  const b = (body ?? {}) as { message?: string; fields?: Record<string, string[]> };
  const fieldMessage = b.fields?.file?.[0];
  if (status === 413) return { message: "Tệp lớn hơn 15 MB. Bạn gửi tệp này qua Zalo nhé.", suggestZalo: true };
  if (status === 429) return { message: "Bạn tải lên hơi nhanh, đợi vài phút rồi thử lại, hoặc gửi tệp qua Zalo.", suggestZalo: true };
  if (status === 400) {
    const reason = fieldMessage ?? b.message;
    return {
      message: translate(reason) ?? "Tệp này không nhận được. Nhận PDF, DWG, DXF và ảnh JPG, PNG, WebP.",
      // Too big is the one rejection the visitor cannot fix by retrying: Zalo can take it.
      suggestZalo: /15 MB/i.test(reason ?? ""),
    };
  }
  return { message: "Không tải được tệp lên. Thử lại, hoặc gửi tệp qua Zalo.", suggestZalo: true };
}

// elc-go answers in English; the two reasons a visitor can actually fix are shown in Vietnamese.
function translate(reason: string | undefined): string | undefined {
  if (!reason) return undefined;
  if (/15 MB/i.test(reason)) return "Tệp lớn hơn 15 MB. Bạn gửi tệp này qua Zalo nhé.";
  if (/only PDF, DWG, DXF/i.test(reason)) return "Chỉ nhận PDF, DWG, DXF và ảnh JPG, PNG, WebP.";
  return undefined;
}

/**
 * Uploads one file to /api/inquiries/files with progress. XMLHttpRequest, not fetch: a
 * 15 MB file on a phone connection takes a while and fetch cannot report how far it got.
 */
export function uploadInquiryFile(file: File, onProgress: (percent: number) => void): UploadHandle {
  const xhr = new XMLHttpRequest();
  const promise = new Promise<UploadResult>((resolve) => {
    xhr.open("POST", "/api/inquiries/files");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && e.total > 0) onProgress(Math.min(99, Math.round((e.loaded / e.total) * 100)));
    };
    xhr.onerror = () => resolve({ ok: false, message: NETWORK_MESSAGE, suggestZalo: false });
    xhr.ontimeout = xhr.onerror;
    xhr.onabort = () => resolve({ ok: false, message: "", suggestZalo: false });
    xhr.onload = () => {
      let body: unknown = null;
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        // not JSON: a proxy page. Handled below by the status alone.
      }
      if (xhr.status === 200 && body && typeof (body as UploadedFile).key === "string") {
        onProgress(100);
        resolve({ ok: true, file: body as UploadedFile });
        return;
      }
      resolve({ ok: false, ...messageFor(xhr.status, body) });
    };
    const form = new FormData();
    form.append("file", file, file.name);
    xhr.send(form);
  });
  return { promise, abort: () => xhr.abort() };
}
