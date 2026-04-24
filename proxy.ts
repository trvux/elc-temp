import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";
import { NextResponse } from "next/server";
import redirectMap from "./redirect-map.json";

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // 1. Xử lý Redirect hoặc Gone (SEO Rescue)
  let path = pathname.startsWith("/") ? pathname.slice(1) : pathname;
  // Chuẩn hóa: xóa dấu / ở cuối nếu có để khớp với Map
  if (path.endsWith("/") && path.length > 1) {
    path = path.slice(0, -1);
  }
  const fullPath = search ? path + search : path;
  
  const destination = (redirectMap as Record<string, string>)[fullPath] || (redirectMap as Record<string, string>)[path];

  // 1.1 Khai tử tự động các pattern WordPress rác
  const wpPatterns = [
    'wp-admin', 'wp-includes', 'wp-content', 'wp-json', 
    'xmlrpc.php', '.php', 
    '/?p=', '/category/', '/tag/', '/author/', '/comments/', '/feed/',
    '/product-category/', '/product-tag/', '/danh-muc/', '/san-pham-cu/'
  ];
  
  const isWpLegacy = wpPatterns.some(p => 
    pathname.includes(p) || 
    search.includes(p) || 
    pathname.startsWith('/wp-') ||
    pathname.startsWith('/category/') ||
    pathname.startsWith('/tag/')
  );

  // Nếu nằm trong Map hoặc dính Pattern WP cũ -> Trả về 410
  if (destination === "GONE" || isWpLegacy) {
    const url = request.nextUrl.clone();
    url.pathname = "/gone";
    return NextResponse.rewrite(url, { 
      status: 410,
      headers: { 
        "x-robots-tag": "noindex, nofollow, noarchive",
        "cache-control": "public, max-age=31536000, immutable" 
      } 
    });
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
