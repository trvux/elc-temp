import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
  const { data: groupData, error: groupErr } = await supabase
    .from("group_categories")
    .select("name, slug, content, faq")
    .eq("slug", "may-lanh")
    .single();

  console.log("Group Content and FAQ Data:", JSON.stringify(groupData, null, 2), "Error:", groupErr);
}

check().catch(console.error);
