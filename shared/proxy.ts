import { updateSession } from "@/shared/lib/supabase/session";
import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { Database } from "@/database.types";

const WP_PREFIXES = ["/product/", "/category/", "/shop/", "/tag/", "/author/", "/wp-content/"];

const SYSTEM_PATHS = new Set([
  "san-pham",
  "du-an",
  "tin-tuc",
  "thong-tin",
  "co-so-ha-tang",
  "dich-vu",
  "thank-you",
  "admin",
  "api",
  "login",
  "signup",
  "favicon.ico",
  "sitemap.xml",
  "robots.txt",
  "sitemap-migration.xml",
]);

export async function proxy(request: NextRequest) {
  let pathname = request.nextUrl.pathname;

  // Normalize: Strip trailing slash (unless it is root "/")
  if (pathname.length > 1 && pathname.endsWith("/")) {
    pathname = pathname.slice(0, -1);
  }

  // Handle feed URLs (strip feed and redirect or process clean pathname)
  let isFeed = false;
  if (pathname.endsWith("/feed")) {
    pathname = pathname.substring(0, pathname.length - 5);
    isFeed = true;
    if (pathname === "") {
      pathname = "/";
    }
  }

  const parts = pathname.split("/").filter(Boolean);
  const lastSegment = parts.length > 0 ? parts[parts.length - 1] : "";

  // 1. Redirect if it's a WordPress feed or ends with feed
  if (isFeed) {
    return NextResponse.redirect(new URL(pathname, request.url), 308);
  }

  // 2. Handle old WordPress specific prefixes
  const startsWithWpPrefix = WP_PREFIXES.some(prefix => pathname.startsWith(prefix));
  if (startsWithWpPrefix) {
    if (pathname.startsWith("/product/") || pathname.startsWith("/shop/") || pathname.startsWith("/category/")) {
      if (lastSegment) {
        return NextResponse.redirect(new URL(`/san-pham/${lastSegment}`, request.url), 308);
      }
    }
    if (pathname.startsWith("/tag/") || pathname.startsWith("/author/")) {
      return NextResponse.redirect(new URL("/", request.url), 308);
    }
  }

  // 3. Handle old .html URLs
  if (pathname.endsWith(".html")) {
    const cleanSlug = lastSegment.replace(/\.html$/, "");
    if (cleanSlug) {
      if (pathname.startsWith("/san-pham/")) {
        return NextResponse.redirect(new URL(`/san-pham/${cleanSlug}`, request.url), 308);
      } else if (pathname.startsWith("/du-an/")) {
        return NextResponse.redirect(new URL(`/du-an/${cleanSlug}`, request.url), 308);
      } else {
        return NextResponse.redirect(new URL(`/tin-tuc/${cleanSlug}`, request.url), 308);
      }
    }
  }

  // 4. Handle nested /san-pham/ paths with > 2 segments
  if (pathname.startsWith("/san-pham/") && parts.length > 2) {
    if (lastSegment) {
      return NextResponse.redirect(new URL(`/san-pham/${lastSegment}`, request.url), 308);
    }
  }

  // 5. Handle nested /du-an/ paths with > 2 segments
  if (pathname.startsWith("/du-an/") && parts.length > 2) {
    if (lastSegment) {
      return NextResponse.redirect(new URL(`/du-an/${lastSegment}`, request.url), 308);
    }
  }

  // 6. Handle root-level old slugs (potential products, projects, or blog posts)
  if (parts.length === 1 && !SYSTEM_PATHS.has(parts[0])) {
    const slug = parts[0];
    
    // Create Supabase client for lookup
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll() {
            // No-op in proxy lookup
          },
        },
      }
    );

    // Check slug registry first
    const { data: registryItem } = await supabase
      .from("slug_registry")
      .select("entity_type")
      .eq("slug", slug)
      .is("deleted_at", null)
      .maybeSingle();

    if (registryItem) {
      if (["product", "category", "brand", "group"].includes(registryItem.entity_type)) {
        return NextResponse.redirect(new URL(`/san-pham/${slug}`, request.url), 308);
      }
      if (["project", "project_type"].includes(registryItem.entity_type)) {
        return NextResponse.redirect(new URL(`/du-an/${slug}`, request.url), 308);
      }
    }

    // Check news table
    const { data: newsItem } = await supabase
      .from("news")
      .select("id")
      .eq("slug", slug)
      .is("deleted_at", null)
      .maybeSingle();

    if (newsItem) {
      return NextResponse.redirect(new URL(`/tin-tuc/${slug}`, request.url), 308);
    }
  }

  // Continue to session management & normal rendering
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
