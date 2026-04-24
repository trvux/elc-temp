import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";
import { NextResponse } from "next/server";
import redirectMap from "./redirect-map.json";

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // 1. Xử lý Redirect hoặc Gone (SEO Rescue)
  let path = pathname.startsWith("/") ? pathname.slice(1) : pathname;
  const fullPath = search ? path + search : path;
  
  const destination = (redirectMap as Record<string, string>)[fullPath] || (redirectMap as Record<string, string>)[path];

  if (destination) {
    if (destination === "GONE") {
      // Rewrite về trang /gone để hiện giao diện đẹp, nhưng trả về status 410 cho SEO
      const url = request.nextUrl.clone();
      url.pathname = "/gone";
      return NextResponse.rewrite(url, { 
        status: 410,
        headers: { "x-robots-tag": "noindex, follow" } 
      });
    }
    
    // Redirect 301
    const url = request.nextUrl.clone();
    url.pathname = destination;
    url.search = ""; 
    return NextResponse.redirect(url, { status: 301 });
  }

  // 2. Logic Admin & Session
  const { response, user } = await updateSession(request);

  const isLoginPage = pathname === "/admin/login";
  const isAdminPath = pathname.startsWith("/admin");

  if (isAdminPath) {
    if (!user && !isLoginPage) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    if (user && isLoginPage) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
