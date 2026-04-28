import { createStaticClient } from "../lib/supabase/static";

async function checkProject() {
  const supabase = createStaticClient();
  const slug = ["thi-cong-may-lanh", "lap-dat-he-thong-dieu-hoa-khong-khi-he-thong-cap-khi-tuoi-biet-thu-pho-thu-dau-mot"];
  const leafSlug = slug[slug.length - 1];
  const categoryPathSegments = slug.slice(0, -1);
  const combinedCategorySlug = categoryPathSegments.join("-");

  console.log("Searching for leafSlug:", leafSlug);
  console.log("Searching for categorySlug:", combinedCategorySlug);

  const { data: project, error } = await supabase
    .from("projects")
    .select("*, categories!inner(slug)")
    .eq("slug", leafSlug)
    .eq("categories.slug", combinedCategorySlug)
    .maybeSingle();

  if (error) {
    console.error("Error:", error);
  } else if (!project) {
    console.log("Project not found with exact match.");
    
    // Check if project exists by slug alone
    const { data: bySlug } = await supabase
      .from("projects")
      .select("*, categories(slug)")
      .eq("slug", leafSlug);
    
    console.log("Matches by project slug only:", bySlug?.length);
    if (bySlug && bySlug.length > 0) {
      console.log("Found project, category slug is:", bySlug[0].categories.slug);
    }
  } else {
    console.log("Project found!", project.title);
  }
}

checkProject();
