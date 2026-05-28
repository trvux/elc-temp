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
  console.log("Querying all published, featured projects...");
  const { data: projects, error } = await supabase
    .from("projects")
    .select(`
      id,
      title,
      is_featured,
      is_published,
      order_index,
      created_at,
      service_type:service_type(id, name, slug)
    `)
    .eq("is_published", true)
    .eq("is_featured", true)
    .is("deleted_at", null)
    .order("order_index", { ascending: true });

  if (error) {
    console.error("Error querying projects:", error);
    return;
  }

  console.log(`Found ${projects?.length || 0} featured projects in total:`);
  projects?.forEach((p, index) => {
    console.log(`${index + 1}. [Order: ${p.order_index}] [ST: ${p.service_type?.name}] ${p.title}`);
  });

  console.log("\nQuerying first 12 featured projects (mimicking homepage query)...");
  const homepageProjects = projects?.slice(0, 12) || [];
  console.log(`Top 12 featured projects:`);
  homepageProjects.forEach((p, index) => {
    console.log(`${index + 1}. [Order: ${p.order_index}] [ST: ${p.service_type?.name}] ${p.title}`);
  });
}

run();
