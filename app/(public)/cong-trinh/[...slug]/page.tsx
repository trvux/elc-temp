import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import { InfoTOC } from "@/components/user/info-toc";
import { Badge } from "@/components/ui/badge";
import { AspectRatio } from "@/components/ui/aspect-ratio";

export default async function ProjectDetail({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const leafSlug = slug[slug.length - 1];
  const categoryPath = slug.slice(0, -1).join("/");

  const supabase = await createClient();

  // Fetch project data with category hierarchy
  const { data: project } = await supabase
    .from("projects")
    .select("*, categories!inner(name, slug, parent:parent_id(name))")
    .eq("slug", leafSlug)
    .eq("categories.slug", categoryPath)
    .single();

  if (!project) {
    notFound();
  }

  // Fetch all projects for the TOC with their full hierarchical paths
  const { data: allProjectsData } = await supabase
    .from("projects")
    .select("id, title, slug, categories(slug)")
    .eq("is_published", true)
    .order("order_index", { ascending: true });

  const allProjects = (allProjectsData || []).map((p) => {
    const cat = Array.isArray(p.categories) ? p.categories[0] : p.categories;
    const catSlug = (cat as { slug: string })?.slug;
    return {
      id: p.id,
      title: p.title,
      slug: catSlug ? `${catSlug}/${p.slug}` : p.slug,
    };
  });

  const images = project.images || [];

  return (
    <main className="w-full pt-28 pb-24 px-4 md:px-6 min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="mb-10 border-b border-border pb-5 flex flex-col gap-4">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border text-muted-foreground text-xs font-medium w-fit">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
              className="text-yellow-500"
            >
              <path d="M12 2C12 2 12 9 19 12C12 15 12 22 12 22C12 22 12 15 5 12C12 9 12 2 12 2Z" />
            </svg>
            {project.categories?.parent?.name
              ? `${project.categories.parent.name} / ${project.categories.name}`
              : project.categories?.name || "Dự án"}
          </span>

          <div className="grid grid-cols-2 items-center gap-4">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground leading-tight">
              {project.title}
            </h1>
            <div className="flex justify-end">
              <InfoTOC
                pages={allProjects}
                currentSlug={`${project.categories?.slug ? project.categories.slug + "/" : ""}${project.slug}`}
                basePath="/cong-trinh"
              />
            </div>
          </div>
        </header>

        {/* Article */}
        <article>
          {/* Hero image */}
          {images[0] && (
            <div className="w-full mb-12 overflow-hidden rounded-sm">
              <AspectRatio ratio={16 / 9}>
                <Image
                  src={images[0]}
                  alt={project.title}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 672px) 100vw, 672px"
                />
              </AspectRatio>
            </div>
          )}

          {/* Rich text content */}
          <div
            className="prose-lg prose-zinc max-w-none
              font-serif
              prose-p:leading-relaxed prose-p:my-6 prose-p:text-foreground/90
              prose-headings:font-sans prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-foreground prose-headings:mt-12 prose-headings:mb-4
              prose-h1:text-4xl prose-h2:text-3xl prose-h3:text-2xl
              prose-a:text-primary prose-a:underline prose-a:underline-offset-4
              prose-blockquote:border-l-2 prose-blockquote:border-border prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-muted-foreground
              prose-img:rounded-sm prose-img:w-full prose-img:h-auto prose-img:my-10
              prose-ul:my-6 prose-ol:my-6
              prose-li:my-1"
            dangerouslySetInnerHTML={{ __html: project.description || "" }}
          />

          {/* Additional images */}
          {images.length > 1 && (
            <div className="mt-16 flex flex-col gap-10">
              {images.slice(1).map((img: string, i: number) => (
                <div key={i} className="w-full overflow-hidden rounded-sm">
                  <AspectRatio ratio={3 / 2}>
                    <Image
                      src={img}
                      alt={`${project.title} - ảnh ${i + 1}`}
                      fill
                      className="object-contain"
                      sizes="(max-width: 672px) 100vw, 672px"
                    />
                  </AspectRatio>
                </div>
              ))}
            </div>
          )}
        </article>

        {/* Footer */}
        <footer className="mt-24 pt-8 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} ELC</span>

          <a
            href="#"
            className="hover:text-foreground transition-colors font-medium uppercase tracking-widest"
          >
            Trở lên đầu trang
          </a>
        </footer>
      </div>
    </main>
  );
}
