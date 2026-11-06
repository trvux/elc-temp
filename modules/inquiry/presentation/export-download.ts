import type { InquiryFilter } from "../domain";

export interface ExportRequest extends Pick<InquiryFilter, "status" | "from" | "to"> {
  /** Selected rows; when present they replace the other filters' scope. */
  ids?: string[];
}

export type ExportResult = { ok: true; fileName: string } | { ok: false; error: string };

// Fetches the .xlsx and hands it to the browser as a download. fetch + blob rather
// than navigating to the URL, so a 403 for a non-admin becomes a message in the
// admin page instead of replacing it with plain text.
export async function downloadInquiryExport(request: ExportRequest): Promise<ExportResult> {
  const params = new URLSearchParams();
  if (request.status && request.status !== "all") params.set("status", request.status);
  if (request.from) params.set("from", request.from);
  if (request.to) params.set("to", request.to);
  if (request.ids?.length) params.set("ids", request.ids.join(","));

  let res: Response;
  try {
    res = await fetch(`/api/inquiries/export?${params.toString()}`, { cache: "no-store" });
  } catch {
    return { ok: false, error: "Không kết nối được máy chủ." };
  }
  if (!res.ok) {
    return { ok: false, error: (await res.text()) || `Lỗi ${res.status}` };
  }

  const fileName = /filename="([^"]+)"/.exec(res.headers.get("Content-Disposition") ?? "")?.[1] ?? "lead.xlsx";
  const url = URL.createObjectURL(await res.blob());
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  return { ok: true, fileName };
}
