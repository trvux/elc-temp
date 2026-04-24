import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";
import redirectMap from "./redirect-map.json";

// 1. Khai tử tự động các pattern WordPress rác - Dùng Set để tra cứu nhanh hơn (O(1))
const WP_PATTERNS = [
  'wp-admin', 'wp-includes', 'wp-content', 'wp-json', 
  'xmlrpc.php', '.php', 
  '/?p=', '/category/', '/tag/', '/author/', '/comments/', '/feed/',
  '/product-category/', '/product-tag/', '/danh-muc/', '/san-pham-cu/'
];

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

  // 1.1 Kiểm tra pattern WP cũ
  const isWpLegacy = WP_PATTERNS.some(p => pathname.includes(p) || search.includes(p));
  
  // Nếu nằm trong Map hoặc dính Pattern WP cũ -> Trả về 410 (GONE)
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

  // 2. TỰ ĐỘNG DỌN DẸP LINK RÁC (SEO RESCUE)
  // Nếu URL dính --- hoặc sai cấu trúc danh mục cũ -> Redirect về link chuẩn
  const hasTripleDash = pathname.includes("---") || pathname.includes("--");
  const hasOldCategory = pathname.includes("/may-lanh/treo-tuong/");
  const hasSpaces = pathname.includes("%20") || pathname.includes(" ");

  if (hasTripleDash || hasOldCategory || hasSpaces) {
    let cleanPathname = pathname
      .replace(/\/may-lanh\/treo-tuong\//g, "/may-lanh-treo-tuong/")
      .replace(/-+/g, "-")
      .replace(/\s+/g, "");
    
    return NextResponse.redirect(new URL(cleanPathname + search, request.url), 301);
  }

  // 3. Logic Admin & Session - CHỈ CHẠY KHI VÀO ADMIN ĐỂ TỐI ƯU TỐC ĐỘ (< 1s cho public)
  const isAdminPath = pathname.startsWith("/admin");
  const isLoginPage = pathname === "/admin/login";

  if (isAdminPath) {
    const { response, user } = await updateSession(request);
    
    if (!user && !isLoginPage) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    if (user && isLoginPage) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return response;
  }

  // Đối với trang Public, không cần check Supabase Session ở Middleware
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
