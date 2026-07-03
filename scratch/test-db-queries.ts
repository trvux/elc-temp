import { createStaticClient } from "../shared/lib/supabase/static";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createStaticClient();

async function test() {
  const tables = [
    { name: "categories", select: "*" },
    { name: "brands", select: "*" },
    { name: "group_categories", select: "*" },
    { name: "products", select: "*" },
    { name: "services", select: "*" },
    { name: "pages", select: "*" },
    { name: "projects", select: "*" },
    { name: "project_type", select: "*" },
    { name: "news", select: "*" },
    { name: "branches", select: "*" }
  ];

  for (const t of tables) {
    const { data, error } = await supabase.from(t.name).select(t.select).limit(1);
    if (error) {
      console.error(`Error querying ${t.name}:`, error.message);
    } else if (data && data.length > 0) {
      console.log(`\n=== Table: ${t.name} ===`);
      console.log("Keys:", Object.keys(data[0]));
    } else {
      console.log(`\n=== Table: ${t.name} ===`);
      console.log("Empty or no data");
    }
  }
}

test().catch(console.error);
