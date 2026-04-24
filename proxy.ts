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
      // Trả về lỗi 410 (Gone) để Google xóa link này vĩnh viễn
      return new NextResponse(null, { status: 410 });
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
