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

async function findFuzzyRedirect(
  supabase: ReturnType<typeof createServerClient<Database>>,
  oldSlug: string
): Promise<{ pathname: string } | null> {
  const oldTokens = tokenize(oldSlug);
  if (oldTokens.length === 0) return null;

  // 1. Fetch all active slugs from registry
  const { data: registry } = await supabase
    .from("slug_registry")
    .select("slug, entity_type")
    .is("deleted_at", null);

  if (registry) {
    let bestMatch: { slug: string; entity_type: string } | null = null;
    let maxScore = 0;

    for (const item of registry) {
      const candidateTokens = tokenize(item.slug);
      const score = calculateScore(oldTokens, candidateTokens);
      if (score > maxScore) {
        maxScore = score;
        bestMatch = item;
      }
    }

    if (bestMatch && maxScore >= 4) {
      if (["product", "category", "brand", "group"].includes(bestMatch.entity_type)) {
        return { pathname: `/san-pham/${bestMatch.slug}` };
      }
      if (["project", "project_type"].includes(bestMatch.entity_type)) {
        return { pathname: `/du-an/${bestMatch.slug}` };
      }
    }
  }

  // 2. Fetch all active news articles
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

  return null;
}

async function resolveRedirectPath(
  supabase: ReturnType<typeof createServerClient<Database>>,
  oldSlug: string,
  defaultBase: "san-pham" | "du-an" | "tin-tuc"
): Promise<string> {
  // 1. Try exact match in registry
  const { data: registryItem } = await supabase
    .from("slug_registry")
    .select("entity_type, slug")
    .eq("slug", oldSlug)
    .is("deleted_at", null)
    .maybeSingle();

  if (registryItem) {
    if (["product", "category", "brand", "group"].includes(registryItem.entity_type)) {
      return `/san-pham/${registryItem.slug}`;
    }
    if (["project", "project_type"].includes(registryItem.entity_type)) {
      return `/du-an/${registryItem.slug}`;
    }
  }

  // 2. Try exact match in news table
  const { data: newsItem } = await supabase
    .from("news")
    .select("slug")
    .eq("slug", oldSlug)
    .is("deleted_at", null)
    .maybeSingle();

  if (newsItem) {
    return `/tin-tuc/${newsItem.slug}`;
  }

  // 3. Fallback to fuzzy match
  const fuzzy = await findFuzzyRedirect(supabase, oldSlug);
  if (fuzzy) {
    return fuzzy.pathname;
  }

  // 4. Default fallback if nothing matches
  return `/${defaultBase}/${oldSlug}`;
}

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

  // 1. Redirect if it's a WordPress feed or ends with feed
  if (isFeed) {
    return NextResponse.redirect(new URL(pathname, request.url), 308);
  }

  // 2. Handle old WordPress specific prefixes
  const startsWithWpPrefix = WP_PREFIXES.some(prefix => pathname.startsWith(prefix));
  if (startsWithWpPrefix) {
    if (pathname.startsWith("/product/") || pathname.startsWith("/shop/") || pathname.startsWith("/category/")) {
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

  // 4. Handle nested /san-pham/ paths with > 2 segments
  if (pathname.startsWith("/san-pham/") && parts.length > 2) {
    if (lastSegment) {
      const dest = await resolveRedirectPath(supabase, lastSegment, "san-pham");
      return NextResponse.redirect(new URL(dest, request.url), 308);
    }
  }

  // 5. Handle nested /du-an/ paths with > 2 segments
  if (pathname.startsWith("/du-an/") && parts.length > 2) {
    if (lastSegment) {
      const dest = await resolveRedirectPath(supabase, lastSegment, "du-an");
      return NextResponse.redirect(new URL(dest, request.url), 308);
    }
  }

  // 6. Handle root-level old slugs (potential products, projects, or blog posts)
  if (parts.length === 1 && !SYSTEM_PATHS.has(parts[0])) {
    const slug = parts[0];
    
    // Check if it exists exactly or fuzzy matches
    const dest = await resolveRedirectPath(supabase, slug, "tin-tuc");
    // Only redirect if it doesn't fall back to the default tin-tuc (meaning we found a real match!)
    if (dest !== `/tin-tuc/${slug}`) {
      return NextResponse.redirect(new URL(dest, request.url), 308);
    } else {
      // Check if it exists exactly in news table (if it does, dest would be /tin-tuc/slug anyway, which we want to redirect to)
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
  }

  // Continue to session management & normal rendering
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
