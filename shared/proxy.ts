import { updateSession } from "@/shared/lib/auth/session";
import { type NextRequest, NextResponse } from "next/server";
import redirectsMap from "./redirects-map.json";

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
    if (parts.length === 3) {
      // /san-pham/{cat}/{product} → /san-pham/{product}
      return NextResponse.redirect(new URL(`/san-pham/${parts[2]}`, request.url), 308);
    }
  }

  // 3. /du-an/ multi-segment (taxonomy hierarchy cũ)
  if (pathname.startsWith("/du-an/")) {
    const parts = pathname.split("/").filter(Boolean); // ["du-an", ...]
    if (parts.length >= 3) {
      // /du-an/{type}/{cat}/{slug} hoặc /du-an/{type}/{slug} → /du-an/{last}
      return NextResponse.redirect(new URL(`/du-an/${parts[parts.length - 1]}`, request.url), 308);
    }
  }

  // 4. /chi-nhanh/{slug} → /thong-tin/{slug} (giữ đúng trang chi nhánh, không dồn về hub
  // chung — hub chung làm mất internal-link equity của các URL /chi-nhanh cũ)
  if (pathname.startsWith("/chi-nhanh/")) {
    const parts = pathname.split("/").filter(Boolean); // ["chi-nhanh", slug, ...]
    const slug = parts[parts.length - 1];
    return NextResponse.redirect(
      new URL(slug && slug !== "chi-nhanh" ? `/thong-tin/${slug}` : "/thong-tin", request.url),
      308,
    );
  }

  // 5. Handle old .html URLs (if not matched in static map, fallback to hubs)
  // Loại trừ file xác thực domain của bên thứ 3 (ví dụ Zalo) nằm trong public/,
  // nếu không sẽ bị redirect về "/" trước khi Next.js kịp serve static file.
  if (pathname.endsWith(".html") && !pathname.startsWith("/zalo_verifier")) {
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

