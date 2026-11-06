import { clientIpHeaders } from "@/shared/lib/go-api";
import { MAX_FILE_BYTES } from "@/modules/inquiry/domain/attachments";

export const dynamic = "force-dynamic";

const GO_API_URL = process.env.GO_API_URL;

// A customer's drawing or photo, up to 15 MB. A plain Route Handler rather than a Server
// Action: Server Actions cap the body (next.config.ts sets 4 MB for the old photo upload) and
// load it whole, while this streams the multipart body straight on to elc-go, which checks
// the type from the file's own bytes and writes it to the private bucket. Kept out of
// proxy.ts's matcher on purpose: Next buffers a proxied request body and cuts it at 10 MB.
//
// Public, like the lead form itself: elc-go rate-limits it per IP (the real visitor IP is
// forwarded) and refuses anything that is not a PDF, DWG, DXF or JPG/PNG/WebP.
export async function POST(request: Request) {
  if (!GO_API_URL) return json(500, { message: "Máy chủ chưa được cấu hình." });

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.startsWith("multipart/form-data")) return json(400, { message: "Yêu cầu không hợp lệ." });

  // A declared size well past the cap is turned away before a byte is streamed. A missing or
  // understated Content-Length is still bounded: elc-go caps the body itself.
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_FILE_BYTES + 1024 * 1024) {
    return json(413, { message: "Tệp lớn hơn 15 MB. Bạn gửi tệp này qua Zalo nhé." });
  }

  try {
    const res = await fetch(`${GO_API_URL}/inquiries/files`, {
      method: "POST",
      headers: { "content-type": contentType, ...(await clientIpHeaders()) },
      body: request.body,
      // Required by Node's fetch to send a stream as the body.
      duplex: "half",
      cache: "no-store",
    } as RequestInit & { duplex: "half" });

    return new Response(res.body, {
      status: res.status,
      headers: { "content-type": res.headers.get("content-type") ?? "application/json" },
    });
  } catch (error) {
    console.error("inquiry file upload: elc-go unreachable", error);
    return json(502, { message: "Không tải được tệp lên, vui lòng thử lại." });
  }
}

function json(status: number, body: { message: string }) {
  return Response.json(body, { status });
}
