import { proxy as sharedProxy } from "@/shared/proxy";
import { captureAttribution } from "@/shared/lib/attribution-capture";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const response = await sharedProxy(request);
  // Decorates whatever response the redirect/session logic above already
  // produced (redirect or next) — doesn't change its behavior.
  captureAttribution(request, response);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
