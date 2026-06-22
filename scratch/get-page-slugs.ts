import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

async function main() {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data: pages, error } = await supabase.from("pages").select("id, title, slug, meta_title, meta_description");
  if (error) {
    console.error("Error fetching pages:", error);
    return;
  }
  console.log("Pages inside DB:");
  console.log(JSON.stringify(pages, null, 2));

  const { data: settings, error: settingsError } = await supabase.from("site_settings").select("*");
  if (settingsError) {
    console.error("Error fetching settings:", settingsError);
    return;
  }
  console.log("Settings inside DB:");
  console.log(JSON.stringify(settings, null, 2));
}

main();
