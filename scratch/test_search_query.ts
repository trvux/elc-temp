import { searchProducts } from "../modules/catalog/application/searchProducts";
import { resolveProductPath } from "../modules/catalog/application/resolveProductPath";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function run() {
  console.log("Resolving path may-lanh-treo-tuong...");
  const resolved = await resolveProductPath("may-lanh-treo-tuong");
  if (!resolved || resolved.type !== "category") {
    console.log("Could not resolve may-lanh-treo-tuong as category", resolved);
    return;
  }

  console.log("Resolved category ID:", resolved.data.id);

  console.log("\n--- Testing searchProducts with q='lg' ---");
  const resultLg = await searchProducts("lg", {
    categoryIds: [resolved.data.id],
    isPublished: true,
  });
  console.log("Total LG products found:", resultLg.totalCount);
  console.log("Products:");
  resultLg.products.forEach(p => console.log(`- [${p.id}] ${p.name} (Brand: ${p.brand?.name})`));

  console.log("\n--- Testing searchProducts with q='daikin' ---");
  const resultDaikin = await searchProducts("daikin", {
    categoryIds: [resolved.data.id],
    isPublished: true,
  });
  console.log("Total Daikin products found:", resultDaikin.totalCount);
  console.log("Products (first 5):");
  resultDaikin.products.slice(0, 5).forEach(p => console.log(`- [${p.id}] ${p.name} (Brand: ${p.brand?.name})`));
}

run();
