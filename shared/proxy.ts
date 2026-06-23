import { updateSession } from "@/shared/lib/supabase/session";
import { type NextRequest, NextResponse } from "next/server";
import redirectsMap from "./redirects-map.json";

const WP_PREFIXES = ["/product/", "/category/", "/shop/", "/tag/", "/author/", "/wp-content/", "/danh-muc/"];

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

  // 2. Handle WordPress prefixes without DB queries
  const startsWithWpPrefix = WP_PREFIXES.some(prefix => pathname.startsWith(prefix));
  if (startsWithWpPrefix) {
    if (pathname.startsWith("/category/") || pathname.startsWith("/danh-muc/")) {
      return NextResponse.redirect(new URL("/san-pham", request.url), 308);
    }
    if (pathname.startsWith("/product/") || pathname.startsWith("/shop/")) {
      return NextResponse.redirect(new URL("/san-pham", request.url), 308);
    }
    return NextResponse.redirect(new URL("/", request.url), 308);
  }

  // 3. Handle old .html URLs (if not matched in static map, fallback to hubs)
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
