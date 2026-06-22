import { updateSession } from "@/shared/lib/supabase/session";
import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { Database } from "@/database.types";
import redirectsMap from "./redirects-map.json";

const WP_PREFIXES = ["/product/", "/category/", "/shop/", "/tag/", "/author/", "/wp-content/", "/danh-muc/"];

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

function tokenize(s: string): string[] {
  return s.toLowerCase().split(/[-_\s/]+/).filter((t) => t.length > 0);
}

function calculateScore(oldTokens: string[], candidateTokens: string[]): number {
  let score = 0;
  for (const token of oldTokens) {
    if (candidateTokens.includes(token)) {
      const hasLetter = /[a-z]/i.test(token);
      const hasNumber = /[0-9]/.test(token);
      if (hasLetter && hasNumber) {
        score += 10;
      } else {
        score += 2;
      }
    }
  }
  return score;
}

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

async function findFuzzyRedirect(
  supabase: ReturnType<typeof createServerClient<Database>>,
  oldSlug: string,
  allowedTypes: ("product" | "category" | "categories" | "brand" | "group" | "project" | "project_type" | "news")[]
): Promise<{ pathname: string } | null> {
  const oldTokens = tokenize(oldSlug);
  if (oldTokens.length === 0) return null;

  const hasNews = allowedTypes.includes("news");
  const hasRegistry = allowedTypes.some((t) => t !== "news");

  if (hasRegistry) {
    const { data: registry } = await supabase
      .from("slug_registry")
      .select("slug, entity_type")
      .is("deleted_at", null);

    if (registry) {
      const filteredRegistry = registry.filter((item) =>
        allowedTypes.includes(item.entity_type as "product" | "category" | "categories" | "brand" | "group" | "project" | "project_type" | "news")
      );

      let bestMatch: typeof filteredRegistry[0] | null = null;
      let maxScore = 0;

      for (const item of filteredRegistry) {
        const candidateTokens = tokenize(item.slug);
        const score = calculateScore(oldTokens, candidateTokens);
        if (score > maxScore) {
          maxScore = score;
          bestMatch = item;
        }
      }

      if (bestMatch && maxScore >= 4) {
        if (["product", "category", "categories", "brand", "group"].includes(bestMatch.entity_type)) {
          return { pathname: `/san-pham/${bestMatch.slug}` };
        }
        if (["project", "project_type"].includes(bestMatch.entity_type)) {
          return { pathname: `/du-an/${bestMatch.slug}` };
        }
      }
    }
  }

  if (hasNews) {
    const { data: news } = await supabase
      .from("news")
      .select("slug")
      .is("deleted_at", null)
      .eq("is_published", true);

    if (news) {
      let bestMatch: { slug: string } | null = null;
      let maxScore = 0;

      for (const item of news) {
        const candidateTokens = tokenize(item.slug);
        const score = calculateScore(oldTokens, candidateTokens);
        if (score > maxScore) {
          maxScore = score;
          bestMatch = item;
        }
      }

      if (bestMatch && maxScore >= 4) {
        return { pathname: `/tin-tuc/${bestMatch.slug}` };
      }
    }
  }

  return null;
}

async function resolveRedirectPath(
  supabase: ReturnType<typeof createServerClient<Database>>,
  oldSlug: string,
  defaultBase: "san-pham" | "du-an" | "tin-tuc" | "danh-muc"
): Promise<string> {
  if (defaultBase === "tin-tuc") {
    const { data: pageItem } = await supabase
      .from("pages")
      .select("slug")
      .eq("slug", oldSlug)
      .is("deleted_at", null)
      .maybeSingle();

    if (pageItem) {
      return `/${pageItem.slug}`;
    }
  }

  let allowedTypes: ("product" | "category" | "categories" | "brand" | "group" | "project" | "project_type" | "news")[] = [];
  if (defaultBase === "san-pham") {
    allowedTypes = ["product", "category", "categories", "brand", "group"];
  } else if (defaultBase === "danh-muc") {
    allowedTypes = ["category", "categories", "group"];
  } else if (defaultBase === "du-an") {
    allowedTypes = ["project", "project_type"];
  } else {
    allowedTypes = ["news"];
  }

  if (defaultBase === "san-pham" || defaultBase === "du-an" || defaultBase === "danh-muc") {
    const { data: registryItem } = await supabase
      .from("slug_registry")
      .select("entity_type, slug")
      .eq("slug", oldSlug)
      .is("deleted_at", null)
      .maybeSingle();

    if (registryItem && allowedTypes.includes(registryItem.entity_type as "product" | "category" | "categories" | "brand" | "group" | "project" | "project_type" | "news")) {
      if (["product", "category", "categories", "brand", "group"].includes(registryItem.entity_type)) {
        return `/san-pham/${registryItem.slug}`;
      }
      if (["project", "project_type"].includes(registryItem.entity_type)) {
        return `/du-an/${registryItem.slug}`;
      }
    }
  }

  if (defaultBase === "tin-tuc") {
    const { data: newsItem } = await supabase
      .from("news")
      .select("slug")
      .eq("slug", oldSlug)
      .is("deleted_at", null)
      .maybeSingle();

    if (newsItem) {
      return `/tin-tuc/${newsItem.slug}`;
    }
  }

  const fuzzy = await findFuzzyRedirect(supabase, oldSlug, allowedTypes);
  if (fuzzy) {
    return fuzzy.pathname;
  }

  if (defaultBase === "san-pham" || defaultBase === "danh-muc") {
    return "/san-pham";
  }
  if (defaultBase === "du-an") {
    return "/du-an";
  }
  return "/";
}

export async function proxy(request: NextRequest) {
  let pathname = request.nextUrl.pathname;

  const cleanPath = normalizePath(pathname);
  const staticDest = (redirectsMap as Record<string, string>)[cleanPath];
  if (staticDest) {
    if (staticDest !== cleanPath) {
      return NextResponse.redirect(new URL(staticDest, request.url), 308);
    }
  }

  if (pathname.length > 1 && pathname.endsWith("/")) {
    pathname = pathname.slice(0, -1);
  }

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

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {},
      },
    }
  );

  if (isFeed) {
    return NextResponse.redirect(new URL(pathname, request.url), 308);
  }

  const startsWithWpPrefix = WP_PREFIXES.some(prefix => pathname.startsWith(prefix));
  if (startsWithWpPrefix) {
    if (pathname.startsWith("/category/") || pathname.startsWith("/danh-muc/")) {
      if (lastSegment) {
        const dest = await resolveRedirectPath(supabase, lastSegment, "danh-muc");
        return NextResponse.redirect(new URL(dest, request.url), 308);
      }
    }
    if (pathname.startsWith("/product/") || pathname.startsWith("/shop/")) {
      if (lastSegment) {
        const dest = await resolveRedirectPath(supabase, lastSegment, "san-pham");
        return NextResponse.redirect(new URL(dest, request.url), 308);
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
        const dest = await resolveRedirectPath(supabase, cleanSlug, "san-pham");
        return NextResponse.redirect(new URL(dest, request.url), 308);
      } else if (pathname.startsWith("/du-an/")) {
        const dest = await resolveRedirectPath(supabase, cleanSlug, "du-an");
        return NextResponse.redirect(new URL(dest, request.url), 308);
      } else {
        const dest = await resolveRedirectPath(supabase, cleanSlug, "tin-tuc");
        return NextResponse.redirect(new URL(dest, request.url), 308);
      }
    }
  }

  // 4. Handle nested /san-pham/ paths
  if (pathname.startsWith("/san-pham/")) {
    if (parts.length > 2) {
      if (lastSegment) {
        const dest = await resolveRedirectPath(supabase, lastSegment, "san-pham");
        return NextResponse.redirect(new URL(dest, request.url), 308);
      }
    } else if (parts.length === 2) {
      const slug = parts[1];
      const dest = await resolveRedirectPath(supabase, slug, "san-pham");
      if (dest !== `/san-pham/${slug}`) {
        return NextResponse.redirect(new URL(dest, request.url), 308);
      }
    }
  }

  // 5. Handle nested /du-an/ paths
  if (pathname.startsWith("/du-an/")) {
    if (parts.length > 2) {
      if (lastSegment) {
        const dest = await resolveRedirectPath(supabase, lastSegment, "du-an");
        return NextResponse.redirect(new URL(dest, request.url), 308);
      }
    } else if (parts.length === 2) {
      const slug = parts[1];
      const dest = await resolveRedirectPath(supabase, slug, "du-an");
      if (dest !== `/du-an/${slug}`) {
        return NextResponse.redirect(new URL(dest, request.url), 308);
      }
    }
  }

  // 6. Handle nested /tin-tuc/ paths
  if (pathname.startsWith("/tin-tuc/") && parts.length === 2) {
    const slug = parts[1];
    const dest = await resolveRedirectPath(supabase, slug, "tin-tuc");
    if (dest !== `/tin-tuc/${slug}`) {
      return NextResponse.redirect(new URL(dest, request.url), 308);
    }
  }

  // 7. Handle root-level old slugs (potential products, projects, or blog posts)
  if (parts.length === 1 && !SYSTEM_PATHS.has(parts[0])) {
    const slug = parts[0];
    
    // Check if it exists exactly or fuzzy matches
    const dest = await resolveRedirectPath(supabase, slug, "tin-tuc");
    if (dest !== `/${slug}`) {
      return NextResponse.redirect(new URL(dest, request.url), 308);
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
