import { createStaticClient } from "@/lib/supabase/static";
import { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://dienmayelc.com.vn";
  const supabase = createStaticClient();

  // 1. Static Pages (Home)
  const staticRoutes = [
    {
      url: baseUrl,
      lastModified: new URLSearchParams().get(""), // Force fresh
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
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/dich-vu`,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/chi-nhanh`,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  // 2. Fetch all dynamic routes
  const [
    { data: products },
    { data: news },
    { data: projects },
    { data: services },
    { data: branches },
    { data: pages },
  ] = await Promise.all([
    supabase.from("products").select("slug, updated_at, categories!inner(slug)").eq("is_published", true),
    supabase.from("news").select("slug, updated_at").eq("is_published", true),
    supabase.from("projects").select("slug, updated_at, categories!inner(slug)").eq("is_published", true),
    supabase.from("services").select("slug, updated_at").eq("is_published", true),
    supabase.from("branches").select("slug").eq("is_published", true),
    supabase.from("pages").select("slug, updated_at").eq("is_published", true),
  ]);

  const productUrls = (products || []).map((p: any) => ({
    url: `${baseUrl}/san-pham/${p.categories.slug}/${p.slug}`,
    lastModified: p.updated_at,
    priority: 0.8,
  }));

  const newsUrls = (news || []).map((n) => ({
    url: `${baseUrl}/tin-tuc/${n.slug}`,
    lastModified: n.updated_at,
    priority: 0.7,
  }));

  const projectUrls = (projects || []).map((p: any) => ({
    url: `${baseUrl}/du-an/${p.categories.slug}/${p.slug}`,
    lastModified: p.updated_at,
    priority: 0.7,
  }));

  const serviceUrls = (services || []).map((s) => ({
    url: `${baseUrl}/dich-vu/${s.slug}`,
    lastModified: s.updated_at,
    priority: 0.7,
  }));

  const branchUrls = (branches || []).map((b) => ({
    url: `${baseUrl}/chi-nhanh/${b.slug}`,
    priority: 0.6,
  }));

  const pageUrls = (pages || []).map((p) => ({
    url: `${baseUrl}/${p.slug}`,
    lastModified: p.updated_at,
    priority: 0.5,
  }));

  // @ts-ignore
  return [...staticRoutes, ...productUrls, ...newsUrls, ...projectUrls, ...serviceUrls, ...branchUrls, ...pageUrls];
}
