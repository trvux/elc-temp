import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import { InfoTOC } from "@/components/user/info-toc";
import { Badge } from "@/components/ui/badge";
import { ScrollToTop } from "@/components/user/scroll-to-top";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Sparkle } from "lucide-react";
import { Metadata } from "next";
import { SEO_CONFIG, extractMetaDescription, generateSchema, generateBreadcrumbSchema } from "@/lib/seo";

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

  const schema = generateSchema("Project", {
    title: project.title,
    description: extractMetaDescription(project.description || "", 200),
    images: project.images,
  });

  const breadcrumbs = generateBreadcrumbSchema([
    { name: "Trang chủ", item: "/" },
    { name: "Dự án", item: "/du-an" },
    ...slug.map((s, i) => ({
      name: i === slug.length - 1 ? project.title : "Danh mục",
      item: `/du-an/${slug.slice(0, i + 1).join("/")}`,
    })),
  ]);

  return (
    <main className="w-full pt-28 pb-24 px-4 md:px-6 min-h-screen">
      {/* JSON-LD for Projects */}
      {schema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      )}
      {breadcrumbs && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
        />
      )}
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="mb-10 border-b border-border pb-8 flex flex-col gap-4">
          {/* Row 1: TOC */}
          <div className="w-full flex justify-start md:justify-start">
            <InfoTOC
              pages={allProjects}
              currentSlug={`${project.categories?.slug ? project.categories.slug + "/" : ""}${project.slug}`}
              basePath="/du-an"
              className="w-full md:w-fit min-w-52"
            />
          </div>

          {/* Row 2: Title and Category */}
          <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-4 md:gap-8">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-foreground leading-tight flex-1">
              {project.title}
            </h1>

            <div className="shrink-0">
              <Badge
                variant="outline"
                className="py-2 gap-1.5 text-muted-foreground text-xs font-medium border-border/50"
              >
                <Sparkle className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                {project.categories?.parent?.name
                  ? `${project.categories.parent.name} / ${project.categories.name}`
                  : project.categories?.name || "Dự án"}
              </Badge>
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

          <ScrollToTop className="hover:text-foreground transition-colors">
            Trở lên đầu trang
          </ScrollToTop>
        </footer>
      </div>
    </main>
  );
}
