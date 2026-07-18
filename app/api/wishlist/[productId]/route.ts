import { forwardVisitorCookieHeader, relayVisitorCookieFromGoResponse } from "@/shared/lib/visitor-cookie";

const GO_API_URL = process.env.GO_API_URL;

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ productId: string }> },
) {
  if (!GO_API_URL) {
    return Response.json({ error: "GO_API_URL is not configured" }, { status: 500 });
  }

  const { productId } = await params;

  try {
    const res = await fetch(`${GO_API_URL}/wishlist/${encodeURIComponent(productId)}`, {
      method: "DELETE",
      headers: await forwardVisitorCookieHeader(),
      cache: "no-store",
    });
    await relayVisitorCookieFromGoResponse(res);

    if (!res.ok && res.status !== 204) {
      return Response.json({ error: "Failed to remove from wishlist" }, { status: res.status });
    }
    return new Response(null, { status: 204 });
  } catch (err) {
    console.error("[/api/wishlist/[productId]] DELETE error:", err);
    return Response.json({ error: "Failed to remove from wishlist" }, { status: 500 });
  }
}
