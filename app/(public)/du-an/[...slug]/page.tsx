import { createClient } from "@/lib/supabase/server";
import { createStaticClient } from "@/lib/supabase/static";
import { notFound } from "next/navigation";
import Image from "next/image";
import { InfoTOC } from "@/components/user/info-toc";
import { Badge } from "@/components/ui/badge";
import { ScrollToTop } from "@/components/user/scroll-to-top";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Sparkle } from "lucide-react";
import { Metadata } from "next";
import { SEO_CONFIG, extractMetaDescription, generateSchema, generateBreadcrumbSchema } from "@/lib/seo";
import { PreviewContent } from "@/components/user/preview-content";

export async function generateStaticParams() {
  const supabase = createStaticClient();
  const { data: projects } = await supabase
    .from("projects")
    .select("slug, categories!inner(slug)")
    .eq("is_published", true);
  
  return (projects ?? []).map((p: any) => ({
    slug: [p.categories.slug, p.slug]
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const leafSlug = slug[slug.length - 1];
  const categoryPathSegments = slug.slice(0, -1);
  const combinedCategorySlug = categoryPathSegments.join("-");

  const supabase = createStaticClient();
  const { data: project } = await supabase
    .from("projects")
    .select("*, categories!inner(slug)")
    .eq("slug", leafSlug)
    .eq("categories.slug", combinedCategorySlug)
    .maybeSingle();

  if (!project) return { title: SEO_CONFIG.defaultTitle };

  const title = project.meta_title || `${project.title} | Dự án ${SEO_CONFIG.siteName}`;
  const description = project.meta_description || extractMetaDescription(project.description || "", 160);
  const url = `${SEO_CONFIG.baseUrl}/du-an/${slug.join("/")}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      images: project.images?.[0] ? [{ url: project.images[0] }] : [],
    },
  };
}

export default async function ProjectDetail({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const leafSlug = slug[slug.length - 1];
  const categoryPathSegments = slug.slice(0, -1);
  const combinedCategorySlug = categoryPathSegments.join("-");
  const staticSupabase = createStaticClient();

  // Fetch the project and all project categories to build the hierarchy
  const [{ data: project }, { data: allCategories }, { data: allProjectsData }] = await Promise.all([
    staticSupabase
      .from("projects")
      .select("*, categories!inner(id, name, slug, parent_id)")
      .eq("slug", leafSlug)
      .eq("categories.slug", combinedCategorySlug)
      .single(),
    staticSupabase
      .from("categories")
      .select("id, name, slug, parent_id")
      .eq("type", "project"),
    staticSupabase
      .from("projects")
      .select("id, title, slug, categories(slug)")
      .eq("is_published", true)
      .order("order_index", { ascending: true }),
  ]);

  if (!project) {
    notFound();
  }

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

  // Build breadcrumbs by traversing the category tree from the DB
  const breadcrumbItems = [
    { name: "Trang chủ", item: "/" },
    { name: "Dự án", item: "/du-an" },
  ];

  if (allCategories && project.categories) {
    const trail: { name: string; slug: string }[] = [];
    let currentCat: any = project.categories;

    while (currentCat) {
      trail.unshift({ name: currentCat.name, slug: currentCat.slug });
      if (currentCat.parent_id) {
        currentCat = allCategories.find(c => c.id === currentCat.parent_id);
      } else {
        currentCat = null;
      }
    }

    trail.forEach(cat => {
      breadcrumbItems.push({
        name: cat.name,
        item: `/du-an?category=${cat.slug}`,
      });
    });
  }

  // Add the project itself
  breadcrumbItems.push({
    name: project.title,
    item: `/du-an/${slug.join("/")}`,
  });

  const breadcrumbs = generateBreadcrumbSchema(breadcrumbItems);

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
              currentSlug={`${project.categories?.slug ? project.categories.slug : "detail"}/${project.slug}`}
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

          {/* Rich text content with image optimization */}
          <PreviewContent content={project.description} hideFirstHeading={true} />

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
