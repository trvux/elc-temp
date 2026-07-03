import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BASE_URL = "https://dienmayelc.com.vn";
const INDEXNOW_KEY = "elcindex2024key";
const KEY_LOCATION = `${BASE_URL}/elcindex2024key.txt`;

async function getAllUrls(): Promise<string[]> {
  const urls: string[] = [
    BASE_URL + "/",
    BASE_URL + "/san-pham",
    BASE_URL + "/dich-vu",
    BASE_URL + "/du-an",
    BASE_URL + "/tin-tuc",
    BASE_URL + "/thong-tin",
    BASE_URL + "/llms.txt",
    BASE_URL + "/llms-full.txt",
  ];

  const [
    { data: categories },
    { data: brands },
    { data: groupCategories },
    { data: products },
    { data: services },
    { data: projects },
    { data: projectTypes },
    { data: news },
    { data: pages },
  ] = await Promise.all([
    supabase.from("categories").select("slug").is("deleted_at", null),
    supabase.from("brands").select("slug").is("deleted_at", null),
    supabase.from("group_categories").select("slug").is("deleted_at", null),
    supabase.from("products").select("slug").eq("is_published", true).is("deleted_at", null),
    supabase.from("services").select("slug").eq("is_published", true).is("deleted_at", null),
    supabase.from("projects").select("slug").eq("is_published", true).is("deleted_at", null),
    supabase.from("project_type").select("slug").is("deleted_at", null),
    supabase.from("news").select("slug").eq("is_published", true).is("deleted_at", null),
    supabase.from("pages").select("slug").eq("is_published", true).is("deleted_at", null),
  ]);

  for (const c of categories || []) urls.push(`${BASE_URL}/san-pham/${c.slug}`);
  for (const b of brands || []) urls.push(`${BASE_URL}/san-pham/${b.slug}`);
  for (const g of groupCategories || []) urls.push(`${BASE_URL}/san-pham/${g.slug}`);
  for (const p of products || []) urls.push(`${BASE_URL}/san-pham/${p.slug}`);
  for (const s of services || []) urls.push(`${BASE_URL}/dich-vu/${s.slug}`);
  for (const p of projects || []) urls.push(`${BASE_URL}/du-an/${p.slug}`);
  for (const pt of projectTypes || []) urls.push(`${BASE_URL}/du-an/${pt.slug}`);
  for (const n of news || []) urls.push(`${BASE_URL}/tin-tuc/${n.slug}`);
  for (const pg of pages || []) urls.push(`${BASE_URL}/${pg.slug}`);

  return urls;
}

async function pingIndexNow(urls: string[]) {
  const CHUNK_SIZE = 100;
  const engines = [
    "https://api.indexnow.org/indexnow",
    "https://www.bing.com/indexnow",
  ];

  for (let i = 0; i < urls.length; i += CHUNK_SIZE) {
    const chunk = urls.slice(i, i + CHUNK_SIZE);
    const body = JSON.stringify({
      host: "dienmayelc.com.vn",
      key: INDEXNOW_KEY,
      keyLocation: KEY_LOCATION,
      urlList: chunk,
    });

    for (const engine of engines) {
      const res = await fetch(engine, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });
      console.log(`[${engine}] chunk ${i / CHUNK_SIZE + 1}: HTTP ${res.status}`);
    }
  }
}

async function main() {
  console.log("Fetching all URLs from database...");
  const urls = await getAllUrls();
  console.log(`Found ${urls.length} URLs to ping.`);
  console.log("Sending IndexNow pings...");
  await pingIndexNow(urls);
  console.log("Done.");
}

main().catch(console.error);
