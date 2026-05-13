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

  // Kiểm tra pattern WP cũ - Chỉ chạy nếu KHÔNG phải đường dẫn sản phẩm/danh mục hiện tại
  const isWpLegacy = pathname.startsWith("/san-pham/") 
    ? false 
    : WP_PATTERNS.some((p) => pathname.includes(p) || search.includes(p));

  if (destination === "GONE" || isWpLegacy) {
    console.log(`[Proxy] Redirecting ${pathname} because GONE=${destination === "GONE"}, isWpLegacy=${isWpLegacy}`);
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

  // --- 2. Dọn dẹp URL rác & Redirect 301 cho cấu trúc URL mới ---
  const parts = pathname.split("/").filter(Boolean);
  
    // Case: /san-pham/[categorySlug]/[productSlug] (Cấu trúc cũ 2 cấp)
    if (parts.length === 3 && parts[0] === "san-pham") {
      const [_, categorySlug, productSlug] = parts;
      
      const { createClient } = await import("@/shared/lib/supabase/server");
      const supabase = await createClient();
      
      // 1. Try exact match
      let { data: product } = await supabase
        .from("products")
        .select("slug, brands(slug)")
        .eq("slug", productSlug)
        .single();

      // 2. If not found, it might be an old slug that still has the brand prefix
      if (!product) {
        const { data: brands } = await supabase.from("brands").select("slug");
        for (const b of (brands || [])) {
          if (productSlug.startsWith(b.slug + "-")) {
            const strippedSlug = productSlug.replace(b.slug + "-", "");
            const { data: p } = await supabase
              .from("products")
              .select("slug, brands(slug)")
              .eq("slug", strippedSlug)
              .single();
            if (p) {
              product = p;
              break;
            }
          }
        }
      }

      if (product && product.brands) {
        const brandSlug = Array.isArray(product.brands) ? product.brands[0].slug : product.brands.slug;
        const finalProductSlug = product.slug;
        return NextResponse.redirect(
          new URL(`/san-pham/${categorySlug}/${brandSlug}/${finalProductSlug}${search}`, request.url),
          301
        );
      }
    }

    // --- 3. Redirect Brand Query to Path (e.g. ?brands=daikin -> /daikin) ---
    const brandQuery = request.nextUrl.searchParams.get("brands");
    if (brandQuery && !brandQuery.includes(",")) {
      // Only redirect if there is one brand selected
      const brandSlug = brandQuery.toLowerCase();
      const currentPath = request.nextUrl.pathname;
      
      // Case: /san-pham?brands=daikin -> /san-pham/daikin
      if (currentPath === "/san-pham") {
        const newUrl = new URL(`/san-pham/${brandSlug}`, request.url);
        // Remove brands from search params
        newUrl.searchParams.delete("brands");
        return NextResponse.redirect(newUrl, 301);
      }
      
      // Case: /san-pham/[categorySlug]?brands=daikin -> /san-pham/[categorySlug]/[brandSlug]
      if (parts.length === 2 && parts[0] === "san-pham") {
        const categorySlug = parts[1];
        const newUrl = new URL(`/san-pham/${categorySlug}/${brandSlug}`, request.url);
        newUrl.searchParams.delete("brands");
        return NextResponse.redirect(newUrl, 301);
      }
    }

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
