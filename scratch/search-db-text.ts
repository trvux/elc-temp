import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function safeIncludes(val: any, search: string): boolean {
  if (!val) return false;
  if (typeof val === "string") {
    return val.toLowerCase().includes(search.toLowerCase());
  }
  try {
    return JSON.stringify(val).toLowerCase().includes(search.toLowerCase());
  } catch {
    return false;
  }
}

async function run() {
  console.log("Searching database tables for 'tổng kho'...");
  
  const search = "tổng kho";

  // 1. Search in group_categories
  const { data: groups } = await supabase.from("group_categories").select("id, name, slug, content, meta_title");
  groups?.forEach(g => {
    if (safeIncludes(g.name, search) || safeIncludes(g.content, search) || safeIncludes(g.meta_title, search)) {
      console.log(`FOUND in group_categories: id=${g.id}, slug=${g.slug}, name=${g.name}, meta_title=${g.meta_title}`);
    }
  });

  // 2. Search in categories
  const { data: cats } = await supabase.from("categories").select("id, name, slug, content, meta_title");
  cats?.forEach(c => {
    if (safeIncludes(c.name, search) || safeIncludes(c.content, search) || safeIncludes(c.meta_title, search)) {
      console.log(`FOUND in categories: id=${c.id}, slug=${c.slug}, name=${c.name}, meta_title=${c.meta_title}`);
    }
  });

  // 3. Search in brands
  const { data: brands } = await supabase.from("brands").select("id, name, slug, content, meta_title");
  brands?.forEach(b => {
    if (safeIncludes(b.name, search) || safeIncludes(b.content, search) || safeIncludes(b.meta_title, search)) {
      console.log(`FOUND in brands: id=${b.id}, slug=${b.slug}, name=${b.name}, meta_title=${b.meta_title}`);
    }
  });

  // 4. Search in products
  const { data: products } = await supabase.from("products").select("id, name, sku, slug, description, meta_title");
  products?.forEach(p => {
    if (safeIncludes(p.name, search) || safeIncludes(p.description, search) || safeIncludes(p.meta_title, search)) {
      console.log(`FOUND in products: id=${p.id}, slug=${p.slug}, name=${p.name}, meta_title=${p.meta_title}`);
    }
  });

  // 5. Search in system_pages
  const { data: systemPages } = await supabase.from("system_pages").select("id, name, slug, meta_title, meta_description");
  systemPages?.forEach(s => {
    if (safeIncludes(s.name, search) || safeIncludes(s.meta_title, search) || safeIncludes(s.meta_description, search)) {
      console.log(`FOUND in system_pages: id=${s.id}, slug=${s.slug}, name=${s.name}, meta_title=${s.meta_title}`);
    }
  });
}

run().catch(console.error);
