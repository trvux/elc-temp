import { createStaticClient } from "../lib/supabase/static";

async function listProjects() {
  const supabase = createStaticClient();
  
  const { data: projects, error } = await supabase
    .from("projects")
    .select("title, slug, categories(slug)")
    .limit(20);

  if (error) {
    console.error("Error:", error);
    return;
  }

  console.log("Current projects in DB:");
  projects?.forEach(p => {
    console.log(`- ${p.title} | Slug: ${p.slug} | Cat: ${p.categories?.slug}`);
  });
}

listProjects();
