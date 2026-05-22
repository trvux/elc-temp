import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function auditProductNames() {
  console.log("Starting Keyword-based Product Name Audit for Air Conditioners...");

  // 1. Fetch products
  const { data: products, error: prodError } = await supabase
    .from("products")
    .select("id, name, category_id");
  if (prodError || !products) {
    console.error("Error fetching products:", prodError);
    return;
  }

  // 2. Fetch new groups
  const { data: newGroups, error: groupError } = await supabase
    .from("group_categories")
    .select("id, name");
  if (groupError || !newGroups) {
    console.error("Error fetching new groups:", groupError);
    return;
  }

  // 3. Fetch new categories
  const { data: newCats, error: newCatError } = await supabase
    .from("category")
    .select("id, name, group_id");
  if (newCatError || !newCats) {
    console.error("Error fetching new categories:", newCatError);
    return;
  }

  const groupAir = newGroups.find(g => g.name.toLowerCase().includes("máy lạnh"));
  if (!groupAir) {
    console.error("Air conditioner group ('Máy lạnh') not found!");
    return;
  }

  const airCats = newCats.filter(c => c.group_id === groupAir.id);
  const airCatMap = new Map<string, string>(); // id to name
  airCats.forEach(c => {
    airCatMap.set(c.id, c.name);
  });

  const airProducts = products.filter(p => airCatMap.has(p.category_id));
  console.log(`Found ${airProducts.length} products currently mapped under the 'Máy lạnh' group.`);

  console.log("\n=== AUDIT RESULTS: CHECKING FOR KEYWORD CLASHES ===");

  let clashCount = 0;

  airProducts.forEach(p => {
    const currentCatName = airCatMap.get(p.category_id)!;
    const nameLower = p.name.toLowerCase();

    // Define rules for clashes:
    // A product assigned to category X should not contain keyword Y of another category.
    let clashFound = false;
    let expectedCategory = "";

    if (currentCatName === "Máy lạnh treo tường") {
      if (nameLower.includes("âm trần")) {
        clashFound = true;
        expectedCategory = "Máy lạnh âm trần đa hướng thổi";
      } else if (nameLower.includes("áp trần")) {
        clashFound = true;
        expectedCategory = "Máy lạnh áp trần";
      } else if (nameLower.includes("giấu trần") || nameLower.includes("nối ống gió")) {
        clashFound = true;
        expectedCategory = "Máy lạnh giấu trần nối ống gió";
      }
    } 
    
    else if (currentCatName === "Máy lạnh âm trần đa hướng thổi") {
      if (nameLower.includes("treo tường")) {
        clashFound = true;
        expectedCategory = "Máy lạnh treo tường";
      } else if (nameLower.includes("áp trần")) {
        clashFound = true;
        expectedCategory = "Máy lạnh áp trần";
      } else if (nameLower.includes("giấu trần") || nameLower.includes("nối ống gió")) {
        clashFound = true;
        expectedCategory = "Máy lạnh giấu trần nối ống gió";
      }
    } 
    
    else if (currentCatName === "Máy lạnh áp trần") {
      if (nameLower.includes("treo tường")) {
        clashFound = true;
        expectedCategory = "Máy lạnh treo tường";
      } else if (nameLower.includes("âm trần")) {
        clashFound = true;
        expectedCategory = "Máy lạnh âm trần đa hướng thổi";
      } else if (nameLower.includes("giấu trần") || nameLower.includes("nối ống gió")) {
        clashFound = true;
        expectedCategory = "Máy lạnh giấu trần nối ống gió";
      }
    } 
    
    else if (currentCatName === "Máy lạnh giấu trần nối ống gió") {
      if (nameLower.includes("treo tường")) {
        clashFound = true;
        expectedCategory = "Máy lạnh treo tường";
      } else if (nameLower.includes("âm trần")) {
        clashFound = true;
        expectedCategory = "Máy lạnh âm trần đa hướng thổi";
      } else if (nameLower.includes("áp trần")) {
        clashFound = true;
        expectedCategory = "Máy lạnh áp trần";
      }
    }

    if (clashFound) {
      clashCount++;
      console.log(`[CLASH #${clashCount}]`);
      console.log(`  Product Name: "${p.name}"`);
      console.log(`  Current Assigned Category: "${currentCatName}"`);
      console.log(`  Expected Category (based on name keyword): "${expectedCategory}"`);
      console.log(`  Product ID: ${p.id}\n`);
    }
  });

  console.log("=== AUDIT SUMMARY ===");
  if (clashCount === 0) {
    console.log("Excellent! 0 keyword clashes found. All products are mapped perfectly according to their names!");
  } else {
    console.log(`Found ${clashCount} potential product classification conflicts based on name keywords.`);
  }
}

auditProductNames();
