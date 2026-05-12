import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function toSlug(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/([^0-9a-z-\s])/g, "")
    .replace(/(\s+)/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function checkSlugs() {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data, error } = await supabase
    .from("products")
    .select("name, sku, slug")
    .limit(10);

  if (error) {
    console.error("Error fetching products:", error);
    return;
  }

  console.log("--- COMPARING LOGIC: (NAME + SKU) VS DB SLUG ---");
  data.forEach((p) => {
    const combined = `${p.name} ${p.sku || ""}`.trim();
    const expectedSlug = toSlug(combined);
    const isMatch = p.slug === expectedSlug;

    console.log(`Name: ${p.name}`);
    console.log(`SKU:  ${p.sku || "N/A"}`);
    console.log(`DB Slug:       ${p.slug}`);
    console.log(`Expected Slug: ${expectedSlug}`);
    console.log(`Status: ${isMatch ? "MATCH ✅" : "MISMATCH ❌"}`);
    console.log("--------------------------------");
  });
}

checkSlugs();
