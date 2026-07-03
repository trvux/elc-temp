import { updateSession } from "@/shared/lib/supabase/session";
import { type NextRequest, NextResponse } from "next/server";
import redirectsMap from "./redirects-map.json";

const WP_PREFIXES = ["/product/", "/category/", "/shop/", "/tag/", "/author/", "/wp-content/", "/danh-muc/"];

// Inline từ shared/lib/districts.ts — tránh import trong edge runtime
const DISTRICT_SLUGS = new Set([
  "quan-1", "quan-3", "quan-4", "quan-5", "quan-6", "quan-7", "quan-8",
  "quan-10", "quan-11", "quan-12", "go-vap", "binh-thanh", "phu-nhuan",
  "tan-binh", "tan-phu", "binh-tan", "thu-duc", "hoc-mon", "cu-chi",
  "nha-be", "can-gio", "binh-chanh",
]);

function normalizePath(rawPath: string): string {
  let p = rawPath.trim();
  if (p.length > 1 && p.endsWith("/")) {
    p = p.slice(0, -1);
  }
  if (p.endsWith("/feed")) {
    p = p.substring(0, p.length - 5);
    if (p === "") p = "/";
  }
  return p;
}

export async function proxy(request: NextRequest) {
  let pathname = request.nextUrl.pathname;

  const cleanPath = normalizePath(pathname);
  
  // 1. Static redirect map lookup (Fast O(1))
  const staticDest = (redirectsMap as Record<string, string>)[cleanPath];
  if (staticDest) {
    if (staticDest !== cleanPath) {
      return NextResponse.redirect(new URL(staticDest, request.url), 308);
    }
  }

  let isFeed = false;
  if (pathname.endsWith("/feed")) {
    pathname = pathname.substring(0, pathname.length - 5);
    isFeed = true;
    if (pathname === "") {
      pathname = "/";
    }
  }

  if (isFeed) {
    return NextResponse.redirect(new URL(pathname, request.url), 308);
  }

  // 2. Generic fallback cho /san-pham/ multi-segment (URL cũ chưa có trong static map)
  if (cleanPath.startsWith("/san-pham/")) {
    const parts = cleanPath.split("/").filter(Boolean); // ["san-pham", ...]
    if (parts.length >= 4) {
      // /san-pham/{cat}/{brand}/{product} → /san-pham/{product}
      return NextResponse.redirect(new URL(`/san-pham/${parts[parts.length - 1]}`, request.url), 308);
    }
    if (parts.length === 3 && !DISTRICT_SLUGS.has(parts[2])) {
      // /san-pham/{cat}/{product} mà {product} không phải quận → /san-pham/{product}
      return NextResponse.redirect(new URL(`/san-pham/${parts[2]}`, request.url), 308);
    }
  }

  // 3. Handle WordPress prefixes without DB queries
  const startsWithWpPrefix = WP_PREFIXES.some(prefix => pathname.startsWith(prefix));
  if (startsWithWpPrefix) {
    if (pathname.startsWith("/category/") || pathname.startsWith("/danh-muc/")) {
      // Lấy segment cuối có nghĩa (bỏ qua "page", số trang, "feed")
      const parts = pathname.split("/").filter(p => p && p !== "page" && !/^\d+$/.test(p) && p !== "feed");
      const last = parts[parts.length - 1];
      // Bỏ segment đầu "danh-muc" hoặc "category"
      const dest = parts.length > 1 ? last : null;
      return NextResponse.redirect(
        new URL(dest ? `/san-pham/${dest}` : "/san-pham", request.url),
        308
      );
    }
    if (pathname.startsWith("/product/") || pathname.startsWith("/shop/")) {
      return NextResponse.redirect(new URL("/san-pham", request.url), 308);
    }
    if (pathname.startsWith("/tag/") || pathname.startsWith("/author/")) {
      return NextResponse.redirect(new URL("/tin-tuc", request.url), 308);
    }
    return NextResponse.redirect(new URL("/", request.url), 308);
  }

  // 3b. Các prefix WP cũ không có trong WP_PREFIXES
  if (pathname.startsWith("/dien-may/")) {
    return NextResponse.redirect(new URL("/san-pham", request.url), 308);
  }
  if (pathname.startsWith("/cong-trinh/")) {
    return NextResponse.redirect(new URL("/du-an", request.url), 308);
  }

  // 4. Old WP category hierarchy pages (không có trong WP_PREFIXES)
  if (
    pathname.startsWith("/he-thong-cap-khi-tuoi/") ||
    pathname.startsWith("/he-thong-dieu-hoa-khong-khi/")
  ) {
    const parts = pathname.split("/").filter(Boolean);
    // ["he-thong-...", "{category}"] → /san-pham/{category}
    const cat = parts[1];
    return NextResponse.redirect(
      new URL(cat ? `/san-pham/${cat}` : "/san-pham", request.url),
      308
    );
  }

  // 5. /du-an/ multi-segment (URL cũ WP taxonomy hierarchy)
  if (pathname.startsWith("/du-an/")) {
    const parts = pathname.split("/").filter(Boolean); // ["du-an", ...]
    if (parts.length >= 3) {
      // /du-an/{type}/{cat}/{slug} hoặc /du-an/{type}/{slug} → /du-an/{last}
      return NextResponse.redirect(new URL(`/du-an/${parts[parts.length - 1]}`, request.url), 308);
    }
  }

  // 6. /chi-nhanh/{slug} → /thong-tin/{slug} (giữ đúng trang chi nhánh, không dồn về hub
  // chung — hub chung làm mất internal-link equity của các URL /chi-nhanh cũ)
  if (pathname.startsWith("/chi-nhanh/")) {
    const parts = pathname.split("/").filter(Boolean); // ["chi-nhanh", slug, ...]
    const slug = parts[parts.length - 1];
    return NextResponse.redirect(
      new URL(slug && slug !== "chi-nhanh" ? `/thong-tin/${slug}` : "/thong-tin", request.url),
      308,
    );
  }

  // 7. Handle old .html URLs (if not matched in static map, fallback to hubs)
  if (pathname.endsWith(".html")) {
    if (pathname.startsWith("/san-pham/")) {
      return NextResponse.redirect(new URL("/san-pham", request.url), 308);
    } else if (pathname.startsWith("/du-an/")) {
      return NextResponse.redirect(new URL("/du-an", request.url), 308);
    } else {
      return NextResponse.redirect(new URL("/", request.url), 308);
    }
  }

  // Continue to session management & normal rendering (lightning fast!)
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
