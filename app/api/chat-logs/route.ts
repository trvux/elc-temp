import { forwardVisitorCookieHeader, relayVisitorCookieFromGoResponse } from "@/shared/lib/visitor-cookie";
import type { NextRequest } from "next/server";

const GO_API_URL = process.env.GO_API_URL;

// Thin BFF proxy to elc-go's public /chat-logs (visitor_id cookie relay —
// same rationale as app/api/recently-viewed/route.ts): every message a
// shopper types into the AI chat finder (ProductChatFinder.tsx) is real
// purchase intent/pain-point data in their own words, logged here
// regardless of which internal path (search/compare/rank/off-topic/
// purchase-intent) actually answered it. POST only — reading the logged
// data back is a staff-only endpoint on the Go side (see
// internal/chat-log/presentation/routes.go), not exposed through this
// public BFF route at all.
export async function POST(request: NextRequest) {
  if (!GO_API_URL) {
    return Response.json({ error: "GO_API_URL is not configured" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const res = await fetch(`${GO_API_URL}/chat-logs`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await forwardVisitorCookieHeader()) },
      body: JSON.stringify({ message: body.message, kind: body.kind }),
      cache: "no-store",
    });
    await relayVisitorCookieFromGoResponse(res);

    if (!res.ok) {
      return Response.json({ error: "Failed to log chat message" }, { status: res.status });
    }
    return new Response(null, { status: 201 });
  } catch (err) {
    console.error("[/api/chat-logs] POST error:", err);
    return Response.json({ error: "Failed to log chat message" }, { status: 500 });
  }
}
