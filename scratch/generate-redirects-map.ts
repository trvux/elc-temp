import * as fs from "fs";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const GSC_DIRS = [
  "/Users/tranvux/Downloads/gg_404",
  "/Users/tranvux/Downloads/16thangtruoc"
];
const OUTPUT_MAP_FILE = path.join(process.cwd(), "shared/redirects-map.json");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface RegistryItem {
  slug: string;
  entity_type: string;
}

interface NewsItem {
  slug: string;
}

interface PageItem {
  slug: string;
}

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

function calculateJaccard(tokensA: string[], tokensB: string[]): number {
  const setA = new Set(tokensA);
  const setB = new Set(tokensB);
  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  if (union.size === 0) return 0;
  return intersection.size / union.size;
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

function matchKeywordRules(slug: string): string | null {
  const s = slug.toLowerCase();
  
  // 1. Remote controls, guides, and timers -> General usage guide (news article)
  if (s.includes("remote") || s.includes("dieu-khien") || s.includes("hen-gio") || s.includes("su-dung")) {
    return "/tin-tuc/top-5-sai-lam-khi-su-dung-may-lanh-ma-nhieu-nguoi-mac-phai";
  }

  // 2. Air conditioner cleaning, maintenance -> Cleaning service page
  if (s.includes("ve-sinh") || s.includes("bao-tri") || s.includes("bao-duong") || s.includes("ong-thoat-nuoc") || s.includes("thao-mat-na") || s.includes("thao-quat")) {
    return "/dich-vu/ve-sinh-bao-tri-cac-dong-may-lanh";
  }

  // 3. Refrigeration systems, cooling diagrams -> Projects page
  if (s.includes("so-do") || s.includes("he-thong-lanh") || s.includes("moi-chat-lanh") || s.includes("leak-test") || s.includes("ro-ri")) {
    return "/du-an";
  }

  // 4. Fresh air ventilation, air filters -> Fresh air product category
  if (s.includes("cap-gio-tuoi") || s.includes("cap-khi-tuoi") || s.includes("loc-bui") || s.includes("loc-khong-khi") || s.includes("menred")) {
    return "/san-pham";
  }

  // 5. Brand-specific error codes or pages
  if (s.includes("daikin")) return "/san-pham/daikin";
  if (s.includes("panasonic")) return "/san-pham/panasonic";
  if (s.includes("lg")) return "/san-pham/lg";
  if (s.includes("samsung")) return "/san-pham/samsung";
  if (s.includes("toshiba")) return "/san-pham/toshiba";
  if (s.includes("gree")) return "/san-pham/gree";
  if (s.includes("midea")) return "/san-pham/midea";

  return null;
}

async function generateRedirectsMap() {
  console.log("Fetching database records...");
  
  // 1. Fetch registry
  const { data: registryData } = await supabase
    .from("slug_registry")
    .select("slug, entity_type")
    .is("deleted_at", null);

  const registry: RegistryItem[] = registryData || [];
  
  // 2. Fetch news
  const { data: newsData } = await supabase
    .from("news")
    .select("slug")
    .is("deleted_at", null)
    .eq("is_published", true);

  const news: NewsItem[] = newsData || [];

  // 3. Fetch static pages
  const { data: pagesData } = await supabase
    .from("pages")
    .select("slug")
    .is("deleted_at", null)
    .eq("is_published", true);

  const pages: PageItem[] = pagesData || [];
  const pageSlugs = new Set(pages.map((p) => p.slug));

  console.log(`Loaded ${registry.length} registry items, ${news.length} news items, and ${pages.length} pages.`);

  // Build the set of all active URLs currently on the website to avoid redirecting them
  const activeUrls = new Set<string>([
    "/",
    "/san-pham",
    "/du-an",
    "/tin-tuc",
    "/thong-tin",
    "/co-so-ha-tang",
    "/dich-vu",
    "/thank-you",
    "/gone",
    "/robots.txt",
    "/sitemap.xml",
    "/sitemap-migration.xml"
  ]);

  for (const item of registry) {
    if (["product", "category", "categories", "brand", "group"].includes(item.entity_type)) {
      activeUrls.add(`/san-pham/${item.slug}`);
    } else if (["project", "project_type"].includes(item.entity_type)) {
      activeUrls.add(`/du-an/${item.slug}`);
    }
  }

  for (const item of news) {
    activeUrls.add(`/tin-tuc/${item.slug}`);
  }

  for (const item of pages) {
    activeUrls.add(`/${item.slug}`);
  }

  // Tokenize candidates for fuzzy matching
  const tokenizedRegistry = registry.map((item) => ({
    ...item,
    tokens: tokenize(item.slug),
  }));

  const tokenizedNews = news.map((item) => ({
    ...item,
    tokens: tokenize(item.slug),
  }));

  // Extract all old URLs from GSC CSVs
  const oldPaths = new Set<string>();
  
  function scanDir(dir: string) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isDirectory()) {
        scanDir(fullPath);
      } else if (file.endsWith(".csv") && (file.includes("Bảng") || file.toLowerCase().includes("trang") || file.toLowerCase().includes("pages"))) {
        const content = fs.readFileSync(fullPath, "utf-8");
        const lines = content.split("\n");
        if (lines.length > 0) {
          // Find URL column index
          const headers = lines[0].split(",");
          let urlColIndex = -1;
          for (let i = 0; i < headers.length; i++) {
            const h = headers[i].trim().replace(/^"|"$/g, "").toLowerCase();
            const cleanHeader = h.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            if (cleanHeader.includes("url") || cleanHeader.normalize("NFC").includes("trang")) {
              urlColIndex = i;
              break;
            }
          }
          if (urlColIndex !== -1) {
            for (let i = 1; i < lines.length; i++) {
              const line = lines[i].trim();
              if (!line) continue;
              const cols = line.split(",");
              if (cols.length > urlColIndex) {
                const rawUrl = cols[urlColIndex].trim().replace(/^"|"$/g, "");
                if (rawUrl.startsWith("http")) {
                  try {
                    const pathname = new URL(rawUrl).pathname;
                    if (pathname && pathname !== "/" && !pathname.includes("/wp-admin/") && !pathname.includes("/admin/")) {
                      oldPaths.add(normalizePath(pathname));
                    }
                  } catch {}
                }
              }
            }
          }
        }
      }
    }
  }

  for (const dir of GSC_DIRS) {
    scanDir(dir);
  }
  console.log(`Found ${oldPaths.size} unique old paths from GSC CSVs.`);

  const redirectsMap: Record<string, string> = {};

  for (const oldPath of oldPaths) {
    // CRITICAL: Skip redirecting if the path matches an active URL exactly
    if (activeUrls.has(oldPath)) {
      console.log(`Skipping redirect for active path: ${oldPath}`);
      continue;
    }

    const parts = oldPath.split("/").filter(Boolean);
    const lastSegment = parts.length > 0 ? parts[parts.length - 1] : "";
    if (!lastSegment) continue;

    // Remove .html suffix if any
    const cleanLastSegment = lastSegment.replace(/\.html$/, "");
    const cleanTokens = tokenize(cleanLastSegment);

    // Skip redirecting if it matches an existing static page slug exactly
    if (parts.length === 1 && pageSlugs.has(parts[0])) {
      continue;
    }

    // Determine type-specific search scope based on old path prefix
    const isCategoryPath =
      oldPath.startsWith("/category/") ||
      oldPath.startsWith("/danh-muc/");

    const isProductPath =
      oldPath.startsWith("/san-pham/") ||
      oldPath.startsWith("/product/") ||
      oldPath.startsWith("/shop/");

    const isProjectPath = oldPath.startsWith("/du-an/") || oldPath.startsWith("/cong-trinh/");

    // 1. Try keyword-based overrides first (dynamic domain matching)
    let matchedDest = matchKeywordRules(cleanLastSegment);

    if (!matchedDest) {
      if (isCategoryPath) {
        // 1. Try exact match in category registry
        const exact = registry.find(
          (r) =>
            r.slug === cleanLastSegment &&
            ["category", "categories", "group"].includes(r.entity_type)
        );
        if (exact) {
          matchedDest = `/san-pham/${exact.slug}`;
        } else {
          // 2. Fuzzy match in category registry
          let bestMatch: typeof tokenizedRegistry[0] | null = null;
          let maxScore = 0;
          let bestJaccard = 0;
          const candidates = tokenizedRegistry.filter((r) =>
            ["category", "categories", "group"].includes(r.entity_type)
          );

          for (const candidate of candidates) {
            const score = calculateScore(cleanTokens, candidate.tokens);
            const jaccard = calculateJaccard(cleanTokens, candidate.tokens);
            if (score > maxScore || (score === maxScore && jaccard > bestJaccard)) {
              maxScore = score;
              bestJaccard = jaccard;
              bestMatch = candidate;
            }
          }

          if (bestMatch && maxScore >= 4 && bestJaccard >= 0.25) {
            matchedDest = `/san-pham/${bestMatch.slug}`;
          } else {
            matchedDest = "/san-pham"; // Fallback category hub
          }
        }
      } else if (isProductPath) {
        // 1. Try exact match in product registry
        const exact = registry.find(
          (r) =>
            r.slug === cleanLastSegment &&
            ["product", "category", "categories", "brand", "group"].includes(r.entity_type)
        );
        if (exact) {
          matchedDest = `/san-pham/${exact.slug}`;
        } else {
          // 2. Fuzzy match in product registry
          let bestMatch: typeof tokenizedRegistry[0] | null = null;
          let maxScore = 0;
          let bestJaccard = 0;
          const candidates = tokenizedRegistry.filter((r) =>
            ["product", "category", "categories", "brand", "group"].includes(r.entity_type)
          );

          for (const candidate of candidates) {
            const score = calculateScore(cleanTokens, candidate.tokens);
            const jaccard = calculateJaccard(cleanTokens, candidate.tokens);
            if (score > maxScore || (score === maxScore && jaccard > bestJaccard)) {
              maxScore = score;
              bestJaccard = jaccard;
              bestMatch = candidate;
            }
          }

          if (bestMatch && maxScore >= 4 && bestJaccard >= 0.25) {
            matchedDest = `/san-pham/${bestMatch.slug}`;
          } else {
            matchedDest = "/san-pham"; // Fallback product hub
          }
        }
      } else if (isProjectPath) {
        // 1. Try exact match in projects registry
        const exact = registry.find(
          (r) =>
            r.slug === cleanLastSegment &&
            ["project", "project_type"].includes(r.entity_type)
        );
        if (exact) {
          matchedDest = `/du-an/${exact.slug}`;
        } else {
          // 2. Fuzzy match in projects registry
          let bestMatch: typeof tokenizedRegistry[0] | null = null;
          let maxScore = 0;
          let bestJaccard = 0;
          const candidates = tokenizedRegistry.filter((r) =>
            ["project", "project_type"].includes(r.entity_type)
          );

          for (const candidate of candidates) {
            const score = calculateScore(cleanTokens, candidate.tokens);
            const jaccard = calculateJaccard(cleanTokens, candidate.tokens);
            if (score > maxScore || (score === maxScore && jaccard > bestJaccard)) {
              maxScore = score;
              bestJaccard = jaccard;
              bestMatch = candidate;
            }
          }

          if (bestMatch && maxScore >= 4 && bestJaccard >= 0.25) {
            matchedDest = `/du-an/${bestMatch.slug}`;
          } else {
            matchedDest = "/du-an"; // Fallback projects hub
          }
        }
      } else {
        // General root paths or news/blog post paths
        // 1. Try exact match in registry (could be a product or project at root level)
        const exactRegistry = registry.find((r) => r.slug === cleanLastSegment);
        if (exactRegistry) {
          if (["product", "category", "categories", "brand", "group"].includes(exactRegistry.entity_type)) {
            matchedDest = `/san-pham/${exactRegistry.slug}`;
          } else {
            matchedDest = `/du-an/${exactRegistry.slug}`;
          }
        } else {
          // 2. Try exact match in news
          const exactNews = news.find((n) => n.slug === cleanLastSegment);
          if (exactNews) {
            matchedDest = `/tin-tuc/${exactNews.slug}`;
          } else {
            // 3. Fuzzy match in news
            let bestMatchNews: typeof tokenizedNews[0] | null = null;
            let maxScoreNews = 0;
            let bestJaccardNews = 0;
            for (const candidate of tokenizedNews) {
              const score = calculateScore(cleanTokens, candidate.tokens);
              const jaccard = calculateJaccard(cleanTokens, candidate.tokens);
              if (score > maxScoreNews || (score === maxScoreNews && jaccard > bestJaccardNews)) {
                maxScoreNews = score;
                bestJaccardNews = jaccard;
                bestMatchNews = candidate;
              }
            }

            if (bestMatchNews && maxScoreNews >= 4 && bestJaccardNews >= 0.25) {
              matchedDest = `/tin-tuc/${bestMatchNews.slug}`;
            } else {
              matchedDest = "/"; // Fallback homepage
            }
          }
        }
      }
    }

    if (matchedDest) {
      redirectsMap[oldPath] = matchedDest;
    }
  }

  // Write static mapping to JSON
  fs.writeFileSync(OUTPUT_MAP_FILE, JSON.stringify(redirectsMap, null, 2), "utf-8");
  console.log(`Successfully generated static redirects map with ${Object.keys(redirectsMap).length} mappings at: shared/redirects-map.json`);
}

generateRedirectsMap().catch(console.error);
