import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function generateMigration() {
  console.log("Fetching products...");
  const { data: products, error: prodError } = await supabase
    .from("products")
    .select("id, name, category_id");
  
  if (prodError) {
    console.error("Error fetching products:", prodError);
    return;
  }

  console.log("Fetching old categories...");
  const { data: oldCats, error: oldCatError } = await supabase
    .from("categories")
    .select("id, name, parent_id");
  
  if (oldCatError) {
    console.error("Error fetching old categories:", oldCatError);
    return;
  }

  console.log("Fetching new groups...");
  const { data: newGroups, error: groupError } = await supabase
    .from("group_categories")
    .select("id, name");
  
  if (groupError) {
    console.error("Error fetching new groups:", groupError);
    return;
  }

  console.log("Fetching new categories...");
  const { data: newCats, error: newCatError } = await supabase
    .from("category")
    .select("id, name, group_id");
  
  if (newCatError) {
    console.error("Error fetching new categories:", newCatError);
    return;
  }

  console.log(`Found ${products?.length || 0} products.`);
  console.log(`Found ${oldCats?.length || 0} old categories.`);
  console.log(`Found ${newGroups?.length || 0} new groups.`);
  console.log(`Found ${newCats?.length || 0} new categories.`);

  // Maps for old categories
  const oldCatMap = new Map<string, { name: string; parentId: string | null }>();
  oldCats?.forEach(c => {
    oldCatMap.set(c.id, { name: c.name, parentId: c.parent_id });
  });

  // Helper to get old parent name
  const getOldHierarchy = (catId: string) => {
    const child = oldCatMap.get(catId);
    if (!child) return { childName: "Unknown", parentName: "Unknown" };
    
    if (!child.parentId) {
      return { childName: child.name, parentName: child.name };
    }
    
    const parent = oldCatMap.get(child.parentId);
    return { childName: child.name, parentName: parent ? parent.name : "Unknown" };
  };

  // Find best match in new categories based on child and parent names
  const findNewCategory = (oldCatId: string) => {
    const { childName, parentName } = getOldHierarchy(oldCatId);
    
    // We want to match:
    // parentName (old) -> newGroup
    // childName (old) -> newCategory
    
    // Let's first clean names
    const cleanChild = childName.toLowerCase().trim();
    const cleanParent = parentName.toLowerCase().trim();

    // 1. Try exact match on new category name containing the child name or matching it
    // E.g. childName "Treo tường" and parentName "Máy lạnh" should map to newCategory "Máy lạnh treo tường"
    let bestMatch = newCats?.find(c => {
      const cName = c.name.toLowerCase();
      // Check if it belongs to the correct group (group name matches parentName)
      const group = newGroups?.find(g => g.id === c.group_id);
      const groupName = group ? group.name.toLowerCase() : "";
      
      const groupMatches = groupName.includes(cleanParent) || cleanParent.includes(groupName);
      const catMatches = cName.includes(cleanChild) || cleanChild.includes(cName);
      
      return groupMatches && catMatches;
    });

    if (bestMatch) return bestMatch;

    // 2. Fallback: match only by child name
    bestMatch = newCats?.find(c => c.name.toLowerCase().includes(cleanChild) || cleanChild.includes(c.name.toLowerCase()));
    if (bestMatch) return bestMatch;

    // 3. Fallback: match by group name
    bestMatch = newCats?.find(c => {
      const group = newGroups?.find(g => g.id === c.group_id);
      return group ? group.name.toLowerCase().includes(cleanParent) : false;
    });

    return bestMatch || null;
  };

  // Generate SQL
  let sqlLines: string[] = [];
  sqlLines.push("-- MIGRATION SQL: CONVERT PRODUCT CATEGORIES TO NEW CATEGORIES");
  sqlLines.push("BEGIN;");
  sqlLines.push("");
  sqlLines.push("-- 1. Drop existing foreign key constraint");
  sqlLines.push("ALTER TABLE products DROP CONSTRAINT IF EXISTS products_category_id_fkey;");
  sqlLines.push("");
  sqlLines.push("-- 2. Update category_id for each product based on old hierarchy mapping");

  let mappedCount = 0;
  let unmappedCount = 0;

  products?.forEach(p => {
    const newCat = findNewCategory(p.category_id);
    const { childName, parentName } = getOldHierarchy(p.category_id);
    
    if (newCat) {
      mappedCount++;
      const group = newGroups?.find(g => g.id === newCat.group_id);
      sqlLines.push(`-- Product: "${p.name}" (Old: ${parentName} -> ${childName}) => (New Group: ${group?.name} -> New Cat: ${newCat.name})`);
      sqlLines.push(`UPDATE products SET category_id = '${newCat.id}' WHERE id = '${p.id}';`);
    } else {
      unmappedCount++;
      sqlLines.push(`-- WARNING: Unmapped Product: "${p.name}" (Old: ${parentName} -> ${childName})`);
      // If we have any new category, use it as fallback to ensure the constraint doesn't fail
      if (newCats && newCats.length > 0) {
        sqlLines.push(`UPDATE products SET category_id = '${newCats[0].id}' WHERE id = '${p.id}';`);
      }
    }
  });

  sqlLines.push("");
  sqlLines.push("-- 3. Re-create foreign key constraint pointing to the new category table");
  sqlLines.push("ALTER TABLE products ");
  sqlLines.push("ADD CONSTRAINT products_category_id_fkey ");
  sqlLines.push("FOREIGN KEY (category_id) ");
  sqlLines.push("REFERENCES category(id) ");
  sqlLines.push("ON DELETE RESTRICT;");
  sqlLines.push("");
  sqlLines.push("COMMIT;");

  const sqlContent = sqlLines.join("\n");
  const outputPath = path.join(process.cwd(), "scratch", "migration.sql");
  fs.writeFileSync(outputPath, sqlContent);

  console.log(`\nMigration completed successfully!`);
  console.log(`Mapped products: ${mappedCount}`);
  console.log(`Unmapped products: ${unmappedCount}`);
  console.log(`SQL written to: ${outputPath}`);
}

generateMigration();
