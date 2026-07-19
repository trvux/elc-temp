import { forwardVisitorCookieHeader, relayVisitorCookieFromGoResponse } from "@/shared/lib/visitor-cookie";
import type { NextRequest } from "next/server";

const GO_API_URL = process.env.GO_API_URL;

// Every visitor's wishlist is different (keyed by their own visitor_id
// cookie) — this route must never be cached, by Cloudflare or anyone else.
// Found 2026-07-19: with no explicit Cache-Control, Cloudflare's edge
// cached this route's response for ~4h and served the SAME cached body
// (plus dropped the Set-Cookie that mints a visitor_id) to every visitor
// hitting it in that window — one visitor's wishlist state leaking into
// another's browser, and every dialog-open fetch silently getting a stale
// snapshot regardless of who was actually asking. `force-dynamic` plus an
// explicit no-store response header (not just the outgoing fetch's own
// `cache: "no-store"`, which only controls Next's server-side fetch cache,
// not what this route tells the client/CDN) is required, not optional.
export const dynamic = "force-dynamic";

// Thin BFF proxy to elc-go's /wishlist — same pattern as app/api/products,
// needed here (rather than a plain Server Action) because the visitor_id
// cookie must be forwarded/relayed on every call, and because the wishlist
// heart button on every ProductCard wants a reactive client-side fetch, not
// a form-style Server Action round trip. See shared/lib/visitor-cookie.ts.
export async function GET() {
  if (!GO_API_URL) {
    return Response.json({ error: "GO_API_URL is not configured" }, { status: 500 });
  }

  try {
    const res = await fetch(`${GO_API_URL}/wishlist`, {
      headers: await forwardVisitorCookieHeader(),
      cache: "no-store",
    });
    await relayVisitorCookieFromGoResponse(res);

    if (!res.ok) {
      return Response.json({ error: "Failed to fetch wishlist" }, { status: res.status });
    }
    const items = await res.json();
    return Response.json({ items }, { headers: { "Cache-Control": "no-store, private" } });
  } catch (err) {
    console.error("[/api/wishlist] GET error:", err);
    return Response.json({ error: "Failed to fetch wishlist" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!GO_API_URL) {
    return Response.json({ error: "GO_API_URL is not configured" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const res = await fetch(`${GO_API_URL}/wishlist`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await forwardVisitorCookieHeader()) },
      body: JSON.stringify({ product_id: body.product_id }),
      cache: "no-store",
    });
    await relayVisitorCookieFromGoResponse(res);

    if (!res.ok) {
      return Response.json({ error: "Failed to add to wishlist" }, { status: res.status });
    }
    const item = await res.json();
    return Response.json(item, { status: 201 });
  } catch (err) {
    console.error("[/api/wishlist] POST error:", err);
    return Response.json({ error: "Failed to add to wishlist" }, { status: 500 });
  }
}
