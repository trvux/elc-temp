import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(__dirname, "../.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Simulating a project insert to see the database error...");
  const dummyProject = {
    title: "Test Project Insert",
    slug: `test-project-insert-${Date.now()}`,
    description: {},
    images: [],
    is_featured: false,
    is_published: false,
    meta_title: "Test",
    meta_description: "Test description",
    order_index: 0,
    category_id: "00000000-0000-0000-0000-000000000000",
    service_type_id: null,
  };

  const { data, error } = await supabase
    .from("projects")
    .insert(dummyProject)
    .select()
    .single();

  if (error) {
    console.log("\nDATABASE ERROR OCCURRED DURING INSERT:");
    console.log("---------------------------------------");
    console.log("Code:", error.code);
    console.log("Message:", error.message);
    console.log("Details:", error.details);
    console.log("Hint:", error.hint);
    console.log("---------------------------------------");
  } else {
    console.log("\nSUCCESSFULLY INSERTED PROJECT:", data);
    // Cleanup
    await supabase.from("projects").delete().eq("id", data.id);
    console.log("Cleaned up test project successfully.");
  }
}

run();
