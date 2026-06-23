import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
  const { data, error } = await supabase
    .from("categories")
    .select("name, slug, content")
    .eq("slug", "may-lanh-treo-tuong")
    .single();

  if (error) throw error;
  console.log("Database Content:", JSON.stringify(data, null, 2));
}

check().catch(console.error);
