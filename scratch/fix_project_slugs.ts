import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

function generateSlug(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function cleanupSlugs() {
  console.log("Starting slug cleanup...");

  const { data: projects, error: fetchError } = await supabase
    .from("projects")
    .select("id, title, slug");

  if (fetchError) {
    console.error("Error fetching projects:", fetchError);
    return;
  }

  console.log(`Checking ${projects?.length} projects...`);

  let fixCount = 0;

  for (const project of projects || []) {
    const currentSlug = project.slug;
    // We generate a new slug from the title to ensure it follows the new rules
    const newSlug = generateSlug(project.title);

    if (currentSlug !== newSlug) {
      console.log(`Fixing: "${project.title}"`);
      console.log(`  From: ${currentSlug}`);
      console.log(`  To:   ${newSlug}`);

      const { error: updateError } = await supabase
        .from("projects")
        .update({ slug: newSlug })
        .eq("id", project.id);

      if (updateError) {
        console.error(`  Error updating project ${project.id}:`, updateError);
      } else {
        fixCount++;
      }
    }
  }

  console.log(`\nCleanup finished. Fixed ${fixCount} projects.`);
}

cleanupSlugs();
