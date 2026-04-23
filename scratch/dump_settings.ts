import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function dump() {
  const { data: settings } = await supabase.from("site_settings").select("*");
  const { data: contacts } = await supabase.from("contacts").select("*");
  console.log("SETTINGS:", JSON.stringify(settings, null, 2));
  console.log("CONTACTS:", JSON.stringify(contacts, null, 2));
}

dump();
