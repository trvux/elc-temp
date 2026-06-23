import { createClient } from "@supabase/supabase-js";
import { JSDOM } from "jsdom";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const OUTPUT_JSON_FILE = path.join(process.cwd(), "scratch/raw-scraped-data.json");

interface Entity {
  id: string;
  name: string;
  slug: string;
  type: "category" | "brand" | "group";
}

interface ScrapedResult {
  name: string;
  slug: string;
  type: "category" | "brand" | "group";
  scrapedTexts: string[];
}

async function searchLinks(query: string): Promise<string[]> {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });
    if (!res.ok) return [];
    
    const html = await res.text();
    const dom = new JSDOM(html);
    const doc = dom.window.document;
    const links: string[] = [];
    
    const anchors = doc.querySelectorAll(".result__url");
    anchors.forEach((a) => {
      const href = a.getAttribute("href");
      if (href) {
        const match = href.match(/uddg=([^&]+)/);
        if (match) {
          links.push(decodeURIComponent(match[1]));
        } else if (href.startsWith("http")) {
          links.push(href);
        }
      }
    });
    
    return links.filter((l) => !l.includes("duckduckgo.com")).slice(0, 2); // Get top 2 direct links
  } catch (err) {
    console.error(`Search failed for query "${query}":`, err);
    return [];
  }
}

async function scrapeCoreText(url: string): Promise<string> {
  console.log(`Scraping core content from: ${url}`);
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
    
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    if (!res.ok) return "";
    
    const html = await res.text();
    const dom = new JSDOM(html);
    const doc = dom.window.document;
    
    // Strict cleaning of scripts, styles, layouts, etc.
    const selectors = "script, style, nav, footer, header, iframe, noscript, svg, [role='banner'], [role='navigation']";
    doc.querySelectorAll(selectors).forEach((el) => el.remove());
    
    // Extract paragraphs and lists text
    const texts: string[] = [];
    doc.querySelectorAll("p, li, h1, h2, h3, h4").forEach((el) => {
      const text = el.textContent?.trim();
      if (text && text.length > 25) {
        texts.push(text);
      }
    });
    
    return texts.join("\n\n");
  } catch (err) {
    console.error(`Failed to scrape ${url}:`, err);
    return "";
  }
}

async function run() {
  console.log("Fetching entities from database...");
  
  const [categoriesRes, brandsRes, groupsRes] = await Promise.all([
    supabase.from("categories").select("id, name, slug").is("deleted_at", null),
    supabase.from("brands").select("id, name, slug").is("deleted_at", null),
    supabase.from("group_categories").select("id, name, slug").is("deleted_at", null)
  ]);
  
  const entities: Entity[] = [
    ...(categoriesRes.data || []).map((c) => ({ ...c, type: "category" as const })),
    ...(brandsRes.data || []).map((b) => ({ ...b, type: "brand" as const })),
    ...(groupsRes.data || []).map((g) => ({ ...g, type: "group" as const }))
  ];

  console.log(`Found ${entities.length} entities to scrape.`);
  const results: Record<string, ScrapedResult> = {};

  for (const ent of entities) {
    console.log(`\nProcessing ${ent.type}: ${ent.name} (${ent.slug})...`);
    
    // Build search query based on name
    const query = `${ent.name} chính hãng giá tốt`;
    const links = await searchLinks(query);
    console.log(`Found ${links.length} search links for "${query}".`);

    const scrapedTexts: string[] = [];
    for (const link of links) {
      const coreText = await scrapeCoreText(link);
      if (coreText) {
        scrapedTexts.push(coreText);
      }
      // Brief delay to be polite to servers
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    results[ent.slug] = {
      name: ent.name,
      slug: ent.slug,
      type: ent.type,
      scrapedTexts
    };
  }

  fs.writeFileSync(OUTPUT_JSON_FILE, JSON.stringify(results, null, 2), "utf-8");
  console.log(`\nScraping complete. Raw scraped data written to ${OUTPUT_JSON_FILE}`);
}

run().catch(console.error);
