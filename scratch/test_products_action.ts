import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { getProducts } from "../modules/catalog/application/index";

async function testGetProducts() {
  console.log("Calling getProducts()...");
  try {
    const products = await getProducts();
    console.log("Success! Fetched products count:", products.length);
  } catch (error) {
    console.error("Caught error in getProducts application layer:");
    console.error(error);
  }
}

testGetProducts();
