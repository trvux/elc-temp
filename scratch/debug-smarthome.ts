import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Checking slug: 'smarthome'");
  const { data: registry, error: registryError } = await supabase
    .from("slug_registry")
    .select("*")
    .eq("slug", "smarthome");

  if (registryError) {
    console.error("Registry error:", registryError);
  } else {
    console.log("Registry items for 'smarthome':", registry);
  }

  // Check if there are other similar slugs
  console.log("Checking slugs containing 'smarthome' or 'nha-thong-minh':");
  const { data: regLike, error: regLikeError } = await supabase
    .from("slug_registry")
    .select("*")
    .or("slug.ilike.%smarthome%,slug.ilike.%nha-thong-minh%");

  if (regLikeError) {
    console.error("Registry LIKE error:", regLikeError);
  } else {
    console.log("Similar registry items:", regLike);
  }

  // Let's find groups
  console.log("Checking groups:");
  const { data: groups, error: groupsError } = await supabase
    .from("group_categories")
    .select("*");

  if (groupsError) {
    console.error("Groups error:", groupsError);
  } else {
    console.log("Groups:", groups?.map(g => ({ id: g.id, name: g.name, slug: g.slug })));
  }

  // Let's find categories under 'smarthome' or similar
  console.log("Checking categories:");
  const { data: categories, error: categoriesError } = await supabase
    .from("categories")
    .select("*");

  if (categoriesError) {
    console.error("Categories error:", categoriesError);
  } else {
    console.log("Categories (sample 20):", categories?.slice(0, 20).map(c => ({ id: c.id, name: c.name, slug: c.slug })));
  }

  // Let's search products with name or category related to smarthome
  console.log("Checking products with smarthome / nha thong minh / luxury:");
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, name, slug, sku")
    .or("name.ilike.%thông minh%,name.ilike.%smarthome%");

  if (productsError) {
    console.error("Products error:", productsError);
  } else {
    console.log("Products (count: " + (products?.length || 0) + "):", products?.slice(0, 10));
  }
}

run();
