// What a visitor may attach to a lead and how the form checks it before uploading. The limits
// mirror elc-go's (internal/inquiry/domain/attachment.go): the server re-checks all of them,
// by the file's own bytes, so these only exist to say "no" before a 15 MB upload starts.

export const MAX_FILE_BYTES = 15 * 1024 * 1024;
export const MAX_FILES = 6;
export const MAX_TOTAL_BYTES = 30 * 1024 * 1024;
/** An image bigger than this is shrunk in the browser first (a 200-megapixel phone shot). */
export const IMAGE_SHRINK_ABOVE_BYTES = 8 * 1024 * 1024;

export const ACCEPTED_EXTENSIONS = [".pdf", ".dwg", ".dxf", ".jpg", ".jpeg", ".png", ".webp"] as const;
/** For <input accept>: extensions, since DWG and DXF have no reliable MIME type. */
export const ACCEPT_ATTRIBUTE = ACCEPTED_EXTENSIONS.join(",");

/** A file the server has stored privately; this is what a lead refers to. */
export interface UploadedFile {
  key: string;
  name: string;
  size: number;
  type: string;
}

/** A file as the admin sees it. A private file's key never leaves the server. */
export interface InquiryAttachment {
  /** Only for a legacy public photo. */
  url?: string;
  private: boolean;
  name: string;
  size?: number;
  type?: string;
}

export type FileKind = "image" | "pdf" | "cad" | "other";

export function fileKind(file: { name: string; type?: string }): FileKind {
  const type = file.type ?? "";
  const name = file.name.toLowerCase();
  if (type.startsWith("image/") && type !== "image/vnd.dwg" && type !== "image/vnd.dxf") return "image";
  if (type === "application/pdf" || name.endsWith(".pdf")) return "pdf";
  if (type === "image/vnd.dwg" || type === "image/vnd.dxf" || name.endsWith(".dwg") || name.endsWith(".dxf")) return "cad";
  if (/\.(jpe?g|png|webp)$/.test(name)) return "image";
  return "other";
}

/** "850 KB", "2,3 MB": Vietnamese decimal comma. */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(mb < 10 ? 1 : 0).replace(".", ",")} MB`;
}

export type FileCheck =
  | { ok: true }
  | {
      ok: false;
      reason: "type" | "empty" | "too-large" | "too-many" | "total-too-large";
      message: string;
      /** The visitor cannot fix this by retrying: point them at Zalo, where a big file can go. */
      suggestZalo: boolean;
    };

/**
 * Whether `file` may be added to the files already chosen. Checked by extension only (the
 * server looks at the bytes); a wrong guess here costs the visitor one clear error, never a
 * file that gets through.
 */
export function checkNewFile(file: { name: string; size: number }, existing: { size: number }[]): FileCheck {
  const name = file.name.toLowerCase();
  if (!ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext))) {
    return { ok: false, reason: "type", suggestZalo: false, message: `“${file.name}” không phải loại tệp nhận được. Nhận PDF, DWG, DXF và ảnh JPG, PNG, WebP.` };
  }
  if (file.size === 0) {
    return { ok: false, reason: "empty", suggestZalo: false, message: `“${file.name}” là tệp rỗng.` };
  }
  if (existing.length >= MAX_FILES) {
    return { ok: false, reason: "too-many", suggestZalo: true, message: `Tối đa ${MAX_FILES} tệp. Còn tệp khác, bạn gửi qua Zalo nhé.` };
  }
  if (file.size > MAX_FILE_BYTES) {
    return { ok: false, reason: "too-large", suggestZalo: true, message: `“${file.name}” lớn hơn 15 MB (${formatFileSize(file.size)}). Bạn gửi tệp này qua Zalo nhé.` };
  }
  const total = existing.reduce((sum, f) => sum + f.size, 0) + file.size;
  if (total > MAX_TOTAL_BYTES) {
    return { ok: false, reason: "total-too-large", suggestZalo: true, message: "Các tệp cộng lại vượt 30 MB. Bạn gửi phần còn lại qua Zalo nhé." };
  }
  return { ok: true };
}
