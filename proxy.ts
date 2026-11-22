import { proxy as sharedProxy } from "@/shared/proxy";
import { captureAttribution } from "@/shared/lib/attribution-capture";
import { prefersMarkdown } from "@/shared/lib/agent-markdown/negotiate";
import { resolveMarkdownRoute } from "@/shared/lib/agent-markdown/routes";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isRead = request.method === "GET" || request.method === "HEAD";

  // Internal Markdown handlers (reached via rewrite) skip redirect/session logic.
  if (pathname.startsWith("/agent-md/")) return NextResponse.next();

  // `.md` suffix always serves Markdown; otherwise Accept negotiation decides.
  const markdownRoute = isRead ? resolveMarkdownRoute(pathname) : null;
  if (markdownRoute && (markdownRoute.explicit || prefersMarkdown(request.headers.get("accept")))) {
    return NextResponse.rewrite(new URL(markdownRoute.target, request.url));
  }

  const response = await sharedProxy(request);
  // Decorates whatever response the redirect/session logic above already
  // produced (redirect or next) — doesn't change its behavior.
  captureAttribution(request, response);
  // The same URL now has two representations; caches must key on Accept.
  if (markdownRoute) response.headers.append("Vary", "Accept");
  return response;
}

export const config = {
  matcher: [
    // api/inquiries/files is excluded: a proxied body is buffered and truncated at 10 MB, and customer
    // files go up to 15 MB. The route does its own checks and elc-go enforces the limits.
    "/((?!_next/static|_next/image|favicon.ico|api/inquiries/files|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
