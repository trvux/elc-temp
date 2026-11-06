import { authHeaders } from "@/shared/lib/go-api";
import { exportFileName } from "@/modules/inquiry/domain";
import { buildInquiryWorkbook } from "@/modules/inquiry/infrastructure/export-workbook";
import { type GoInquiryResponse, mapGoInquiry } from "@/modules/inquiry/infrastructure/go-mapper";

export const dynamic = "force-dynamic";

const GO_API_URL = process.env.GO_API_URL;

// Filters the admin table is showing, forwarded as-is; Go validates them.
const FORWARDED_PARAMS = ["status", "search", "from", "to", "ids"] as const;

function plain(status: number, message: string) {
  return new Response(message, { status, headers: { "Content-Type": "text/plain; charset=utf-8" } });
}

// Downloads leads as .xlsx. A route handler instead of a server action because the
// answer is a file. No authorization logic here: the token goes to Go, whose
// /inquiries/export is admin-only, and without it Go returns 401/403 and no data.
export async function GET(request: Request) {
  if (!GO_API_URL) return plain(500, "GO_API_URL is not configured");

  const incoming = new URL(request.url).searchParams;
  const params = new URLSearchParams();
  for (const key of FORWARDED_PARAMS) {
    const value = incoming.get(key);
    if (value && !(key === "status" && value === "all")) params.set(key, value);
  }

  let res: Response;
  try {
    res = await fetch(`${GO_API_URL}/inquiries/export?${params.toString()}`, {
      headers: await authHeaders(),
      cache: "no-store",
    });
  } catch (error) {
    console.error("inquiry export: Go API unreachable", error);
    return plain(502, "Không kết nối được máy chủ.");
  }

  if (res.status === 401) return plain(401, "Phiên đăng nhập đã hết hạn, hãy đăng nhập lại.");
  if (res.status === 403) return plain(403, "Chỉ quản trị viên được xuất dữ liệu khách hàng.");
  if (!res.ok) return plain(502, "Không lấy được dữ liệu để xuất.");

  const rows = ((await res.json()) as GoInquiryResponse[] | null) ?? [];
  const file = await buildInquiryWorkbook(rows.map(mapGoInquiry));

  return new Response(new Uint8Array(file), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${exportFileName(new Date())}"`,
      "Cache-Control": "no-store",
    },
  });
}
