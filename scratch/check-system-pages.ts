import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function run() {
  console.log("Fetching system_pages from DB...");
  const { data: systemPages, error } = await supabase
    .from("system_pages")
    .select("*");

  if (error) {
    console.error("Error:", error);
  } else {
    console.log("System Pages in DB:", JSON.stringify(systemPages, null, 2));
  }
}

run();
