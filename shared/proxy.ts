import { updateSession } from "@/shared/lib/supabase/session";
import { type NextRequest, NextResponse } from "next/server";
import redirectMap from "../redirect-map.json";

// 1. Khai tử tự động các pattern WordPress rác
const WP_PATTERNS = [
  "wp-admin",
  "wp-includes",
  "wp-content",
  "wp-json",
  "xmlrpc.php",
  ".php",
  "/?p=",
  "/category/",
  "/tag/",
  "/author/",
  "/comments/",
  "/feed/",
  "/product-category/",
  "/product-tag/",
  "/danh-muc/",
  "/san-pham-cu/",
];

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // --- 1. Xử lý SEO Redirects ---
  let path = pathname.startsWith("/") ? pathname.slice(1) : pathname;
  if (path.endsWith("/") && path.length > 1) {
    path = path.slice(0, -1);
  }
  const fullPath = search ? path + search : path;

  const destination =
    (redirectMap as Record<string, string>)[fullPath] ||
    (redirectMap as Record<string, string>)[path];

  // Kiểm tra pattern WP cũ
  const isWpLegacy = WP_PATTERNS.some(
    (p) => pathname.includes(p) || search.includes(p),
  );

  if (destination === "GONE" || isWpLegacy) {
    const slug = pathname.split("/").filter(Boolean).pop() || "";
    const searchQuery = slug
      .replace(/-/g, " ")
      .replace(/\d+hp/gi, (match) => match.toUpperCase());

    if (searchQuery && searchQuery.length > 3) {
      return NextResponse.redirect(
        new URL(
          `/san-pham?search=${encodeURIComponent(searchQuery)}`,
          request.url,
        ),
        301,
      );
    }

    const url = request.nextUrl.clone();
    url.pathname = "/gone";
    return NextResponse.rewrite(url, {
      status: 410,
      headers: {
        "x-robots-tag": "noindex, nofollow, noarchive",
        "cache-control": "public, max-age=31536000, immutable",
      },
    });
  }

  // --- 2. Dọn dẹp URL rác ---
  const hasTripleDash = pathname.includes("---") || pathname.includes("--");
  const hasOldCategory = pathname.includes("/may-lanh/treo-tuong/");
  const hasSpaces = pathname.includes("%20") || pathname.includes(" ");

  if (hasTripleDash || hasOldCategory || hasSpaces) {
    let cleanPathname = pathname
      .replace(/\/may-lanh\/treo-tuong\//g, "/may-lanh-treo-tuong/")
      .replace(/-+/g, "-")
      .replace(/\s+/g, "");

    return NextResponse.redirect(
      new URL(cleanPathname + search, request.url),
      301,
    );
  }

  // --- 3. Auth & Session Management ---
  // Chạy updateSession cho tất cả để đảm bảo auth cookie luôn mới
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
