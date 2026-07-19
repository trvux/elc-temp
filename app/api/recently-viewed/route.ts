import { forwardVisitorCookieHeader, relayVisitorCookieFromGoResponse } from "@/shared/lib/visitor-cookie";
import type { NextRequest } from "next/server";

const GO_API_URL = process.env.GO_API_URL;

interface GoRecentlyViewedItem {
  id: string;
  product_id: string;
  viewed_at: string;
  product: {
    id: string;
    name: string;
    slug: string;
    image_url: string;
    display_price: number | null;
  } | null;
}

// Thin BFF proxy to elc-go's /recently-viewed — same rationale as
// app/api/wishlist/route.ts (visitor_id cookie relay + reactive client
// fetch). GET only (no delete/clear-all — the API doesn't support it, see
// shared/hooks/use-recently-viewed.ts's doc comment).
export async function GET() {
  if (!GO_API_URL) {
    return Response.json({ error: "GO_API_URL is not configured" }, { status: 500 });
  }

  try {
    const res = await fetch(`${GO_API_URL}/recently-viewed`, {
      headers: await forwardVisitorCookieHeader(),
      cache: "no-store",
    });
    await relayVisitorCookieFromGoResponse(res);

    if (!res.ok) {
      return Response.json({ error: "Failed to fetch recently-viewed" }, { status: res.status });
    }

    const rows = (await res.json()) as GoRecentlyViewedItem[];
    const items = rows
      .filter((row) => row.product !== null)
      .map((row) => ({
        id: row.product!.id,
        name: row.product!.name,
        slug: row.product!.slug,
        image: row.product!.image_url || null,
        displayPrice: row.product!.display_price,
      }));

    return Response.json({ items });
  } catch (err) {
    console.error("[/api/recently-viewed] GET error:", err);
    return Response.json({ error: "Failed to fetch recently-viewed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!GO_API_URL) {
    return Response.json({ error: "GO_API_URL is not configured" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const res = await fetch(`${GO_API_URL}/recently-viewed`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await forwardVisitorCookieHeader()) },
      body: JSON.stringify({ product_id: body.product_id }),
      cache: "no-store",
    });
    await relayVisitorCookieFromGoResponse(res);

    if (!res.ok) {
      return Response.json({ error: "Failed to record view" }, { status: res.status });
    }
    return new Response(null, { status: 201 });
  } catch (err) {
    console.error("[/api/recently-viewed] POST error:", err);
    return Response.json({ error: "Failed to record view" }, { status: 500 });
  }
}
