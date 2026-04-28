import { createStaticClient } from "../lib/supabase/static";

async function checkProject() {
  const supabase = createStaticClient();
  const leafSlug = "lap-dat-he-thong-dieu-hoa-khong-khi-he-thong-cap-khi-tuoi-biet-thu-pho-thu-dau-mot";
  
  console.log("Searching for project with slug:", leafSlug);

  const { data: projects, error } = await supabase
    .from("projects")
    .select("*, categories(*)")
    .eq("slug", leafSlug);

  if (error) {
    console.error("Error:", error);
    return;
  }

  if (!projects || projects.length === 0) {
    console.log("No projects found with this slug.");
    return;
  }

  console.log(`Found ${projects.length} project(s):`);
  projects.forEach(p => {
    console.log(`- Title: ${p.title}`);
    console.log(`  Is Published: ${p.is_published}`);
    console.log(`  Category Slug: ${p.categories?.slug}`);
    console.log(`  Category ID: ${p.category_id}`);
  });
}

checkProject();
