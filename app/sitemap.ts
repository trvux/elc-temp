import { createStaticClient } from "@/lib/supabase/static";
import { MetadataRoute } from "next";
import redirectMap from "../redirect-map.json";

export const revalidate = 3600; // Cập nhật sitemap mỗi 1 giờ

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://dienmayelc.com.vn";
  const supabase = createStaticClient();

  // 1. Static Pages
  const staticRoutes = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/san-pham`,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/tin-tuc`,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/du-an`,
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/dich-vu`,
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/chi-nhanh`,
      changeFrequency: "daily",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/thong-tin`,
      changeFrequency: "daily",
      priority: 0.5,
    },
  ];

  // 2. Fetch data with error handling
  const [
    { data: products, error: pError },
    { data: news, error: nError },
    { data: projects, error: prError },
    { data: services, error: sError },
    { data: branches, error: bError },
    { data: pages, error: pgError },
  ] = await Promise.all([
    supabase
      .from("products")
      .select("slug, created_at, updated_at, categories!inner(slug)")
      .eq("is_published", true),
    supabase
      .from("news")
      .select("slug, created_at, updated_at")
      .eq("is_published", true),
    supabase
      .from("projects")
      .select("slug, created_at, updated_at, categories!inner(slug)")
      .eq("is_published", true),
    supabase
      .from("services")
      .select("slug, created_at, updated_at")
      .eq("is_published", true),
    supabase
      .from("branches")
      .select("slug, created_at, updated_at")
      .eq("is_published", true),
    supabase
      .from("pages")
      .select("slug, created_at, updated_at")
      .eq("is_published", true),
  ]);

  if (pError) console.error("Sitemap Products Error:", pError);
  if (nError) console.error("Sitemap News Error:", nError);
  if (prError) console.error("Sitemap Projects Error:", prError);
  if (sError) console.error("Sitemap Services Error:", sError);
  if (bError) console.error("Sitemap Branches Error:", bError);
  if (pgError) console.error("Sitemap Pages Error:", pgError);

  const productUrls = (products || []).map((p: any) => ({
    url: `${baseUrl}/san-pham/${p.categories.slug}/${p.slug}`,
    lastModified: p.updated_at || p.created_at,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  const newsUrls = (news || []).map((n: any) => ({
    url: `${baseUrl}/tin-tuc/${n.slug}`,
    lastModified: n.updated_at || n.created_at,
    changeFrequency: "daily",
    priority: 0.7,
  }));

  const projectUrls = (projects || []).map((p: any) => ({
    url: `${baseUrl}/du-an/${p.categories.slug}/${p.slug}`,
    lastModified: p.updated_at || p.created_at,
    changeFrequency: "daily",
    priority: 0.7,
  }));

  const serviceUrls = (services || []).map((s: any) => ({
    url: `${baseUrl}/dich-vu/${s.slug}`,
    lastModified: s.updated_at || s.created_at,
    changeFrequency: "daily",
    priority: 0.7,
  }));

  const branchUrls = (branches || []).map((b: any) => ({
    url: `${baseUrl}/chi-nhanh/${b.slug}`,
    lastModified: b.updated_at || b.created_at,
    changeFrequency: "daily",
    priority: 0.6,
  }));

  const pageUrls = (pages || []).map((p: any) => ({
    url: `${baseUrl}/${p.slug}`,
    lastModified: p.updated_at || p.created_at,
    changeFrequency: "daily",
    priority: 0.5,
  }));

  // 3. Filter out URLs that are in the redirect map (Rescue SEO)
  // Sitemap should only contain 200 OK pages.
  const isRedirected = (path: string) => {
    const cleanPath = path.startsWith("/") ? path.slice(1) : path;
    return !!(redirectMap as Record<string, string>)[cleanPath];
  };

  const filteredProductUrls = productUrls.filter(p => !isRedirected(p.url.replace(baseUrl, "")));
  const filteredNewsUrls = newsUrls.filter(n => !isRedirected(n.url.replace(baseUrl, "")));
  const filteredProjectUrls = projectUrls.filter(p => !isRedirected(p.url.replace(baseUrl, "")));
  const filteredServiceUrls = serviceUrls.filter(s => !isRedirected(s.url.replace(baseUrl, "")));
  const filteredBranchUrls = branchUrls.filter(b => !isRedirected(b.url.replace(baseUrl, "")));
  const filteredPageUrls = pageUrls.filter(p => !isRedirected(p.url.replace(baseUrl, "")));

  return [
    ...staticRoutes,
    ...filteredProductUrls,
    ...filteredNewsUrls,
    ...filteredProjectUrls,
    ...filteredServiceUrls,
    ...filteredBranchUrls,
    ...filteredPageUrls,
  ] as MetadataRoute.Sitemap;
}



