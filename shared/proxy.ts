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

function getRedirectPath(entityType: string, slug: string): string {
  if (entityType === "service_group") {
    return "dich-vu";
  }
  if (entityType === "service") {
    return `dich-vu/${slug}`;
  }
  if (entityType === "project" || entityType === "project_type") {
    return `du-an/${slug}`;
  }
  return `san-pham/${slug}`;
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // --- Xử lý các đường dẫn chứa "chua-phan-loai" (Uncategorized) ---
  if (pathname.includes("/chua-phan-loai")) {
    const redirectTarget = pathname.split("/chua-phan-loai")[0] || "/";
    return NextResponse.redirect(
      new URL(redirectTarget + search, request.url),
      301
    );
  }

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

    const { createClient } = await import("@/shared/lib/supabase/server");
    const supabase = await createClient();
    
    // Tra cứu slug_registry để xác nhận slug này có tồn tại hợp lệ không
    const { data: registryItem } = await supabase
      .from("slug_registry")
      .select("slug, entity_type")
      .eq("slug", slug)
      .is("deleted_at", null)
      .maybeSingle();

    if (registryItem) {
      const targetPath = getRedirectPath(registryItem.entity_type, slug);
      console.log(`[Proxy] Slug exists in registry, redirecting to /${targetPath}`);
      return NextResponse.redirect(
        new URL(`/${targetPath}${search}`, request.url),
        301
      );
    }

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

  // Nếu là 1 segment duy nhất (ví dụ: /may-lanh hoặc /may-loc-khong-khi)
  if (parts.length === 1) {
    const segment = parts[0];
    const STATIC_PATHS = [
      "du-an",
      "dich-vu",
      "chi-nhanh",
      "tin-tuc",
      "thong-tin",
      "san-pham",
      "gone",
      "admin",
      "api",
      "login",
      "register",
    ];

    if (!STATIC_PATHS.includes(segment)) {
      const { createClient } = await import("@/shared/lib/supabase/server");
      const supabase = await createClient();
      
      const { data: registryItem } = await supabase
        .from("slug_registry")
        .select("slug, entity_type")
        .eq("slug", segment)
        .is("deleted_at", null)
        .maybeSingle();

      if (registryItem) {
        const targetPath = getRedirectPath(registryItem.entity_type, segment);
        console.log(`[Proxy] Root slug ${segment} exists in registry, redirecting to /${targetPath}`);
        return NextResponse.redirect(
          new URL(`/${targetPath}${search}`, request.url),
          301
        );
      }
    }
  }
  
  // Xử lý tất cả các đường dẫn lồng ghép cũ (ví dụ: /san-pham/cat/product hoặc /san-pham/cat/brand/product hoặc /san-pham/cat/brand)
  if (parts.length >= 3 && parts[0] === "san-pham") {
    const lastSegment = parts[parts.length - 1];
    
    const { createClient } = await import("@/shared/lib/supabase/server");
    const supabase = await createClient();
    
    // Tra cứu slug_registry để xác nhận slug này có tồn tại hợp lệ không
    const { data: registryItem } = await supabase
      .from("slug_registry")
      .select("slug, entity_type")
      .eq("slug", lastSegment)
      .is("deleted_at", null)
      .maybeSingle();

    if (registryItem) {
      const targetPath = getRedirectPath(registryItem.entity_type, lastSegment);
      console.log(`[Proxy] Redirecting legacy nested path ${pathname} -> /${targetPath}`);
      return NextResponse.redirect(
        new URL(`/${targetPath}${search}`, request.url),
        301
      );
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
