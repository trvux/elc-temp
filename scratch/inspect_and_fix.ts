import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function inspectAndFix() {
  console.log("Fetching products...");
  const { data: products, error: prodError } = await supabase
    .from("products")
    .select("id, name, category_id");
  
  if (prodError) {
    console.error("Error fetching products:", prodError);
    return;
  }
  
  console.log(`Found ${products?.length || 0} products.`);

  console.log("Fetching old categories...");
  const { data: oldCats, error: oldCatError } = await supabase
    .from("categories")
    .select("id, name, slug");
  
  if (oldCatError) {
    console.error("Error fetching old categories:", oldCatError);
    return;
  }

  console.log("Fetching new categories...");
  const { data: newCats, error: newCatError } = await supabase
    .from("category")
    .select("id, name, slug");
  
  if (newCatError) {
    console.error("Error fetching new categories:", newCatError);
    return;
  }

  console.log(`Found ${oldCats?.length || 0} old categories.`);
  console.log(`Found ${newCats?.length || 0} new categories.`);

  const newCatMap = new Map<string, string>(); // name to id for new categories
  const newCatIdSet = new Set(newCats?.map(c => c.id) || []);
  
  newCats?.forEach(c => {
    newCatMap.set(c.name.toLowerCase().trim(), c.id);
  });

  const oldCatMap = new Map<string, string>(); // id to name for old categories
  oldCats?.forEach(c => {
    oldCatMap.set(c.id, c.name);
  });

  console.log("\nChecking for products with invalid category IDs...");
  
  let unmatchedCount = 0;
  for (const p of products || []) {
    if (!newCatIdSet.has(p.category_id)) {
      unmatchedCount++;
      const oldCatName = oldCatMap.get(p.category_id) || "Unknown";
      console.log(`Product: "${p.name}" (ID: ${p.id}) has old category "${oldCatName}" (ID: ${p.category_id})`);
      
      // Try to find a matching new category by name
      const matchingNewId = newCatMap.get(oldCatName.toLowerCase().trim());
      if (matchingNewId) {
        console.log(`  -> Found matching new category "${oldCatName}" with ID: ${matchingNewId}. Migrating product...`);
        const { error: updateError } = await supabase
          .from("products")
          .update({ category_id: matchingNewId })
          .eq("id", p.id);
        
        if (updateError) {
          console.error(`  -> Error migrating product ${p.id}:`, updateError);
        } else {
          console.log(`  -> Product migrated successfully.`);
        }
      } else {
        console.log(`  -> No matching new category found for name "${oldCatName}".`);
        // If there's at least one new category, let's map it to the first new category to avoid constraint failure
        if (newCats && newCats.length > 0) {
          const fallbackNewId = newCats[0].id;
          const fallbackNewName = newCats[0].name;
          console.log(`  -> Using fallback new category "${fallbackNewName}" (ID: ${fallbackNewId})`);
          const { error: updateError } = await supabase
            .from("products")
            .update({ category_id: fallbackNewId })
            .eq("id", p.id);
          if (updateError) {
            console.error(`  -> Error applying fallback to product ${p.id}:`, updateError);
          } else {
            console.log(`  -> Product mapped to fallback successfully.`);
          }
        } else {
          console.log("  -> Warning: No new categories exist in database to fall back to!");
        }
      }
    }
  }

  console.log(`\nFinished check. Unmatched products processed: ${unmatchedCount}`);
}

inspectAndFix();
