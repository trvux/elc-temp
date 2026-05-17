import { getProjectBySlug, getProjects } from "@/modules/project";
import { PreviewContent } from "@/shared/components/layout/user/preview-content";
import { ScrollToTop } from "@/shared/components/layout/user/scroll-to-top";
import { AspectRatio } from "@/shared/components/ui/aspect-ratio";
import { Badge } from "@/shared/components/ui/badge";
import { Sparkle } from "lucide-react";
import Image from "next/image";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
  const projects = await getProjects({ isPublished: true });

  return projects.map((p) => ({
    slug: p.slug,
  }));
}

export default async function ProjectDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Fetch the project and all projects for the TOC
  const [project, allProjectsData] = await Promise.all([
    getProjectBySlug(slug),
    getProjects({ isPublished: true }),
  ]);

  if (!project) {
    notFound();
  }

  const allProjects = (allProjectsData || []).map((p) => {
    return {
      id: p.id,
      title: p.title,
      slug: p.slug,
    };
  });

  const images = project.images || [];

  return (
    <main className="w-full pt-28 pb-24 px-4 md:px-6 min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="mb-10 border-b border-border pb-8 flex flex-col gap-4">
          {/* Row 1: TOC */}
          <div className="w-full flex justify-start md:justify-start">
            {/* <InfoTOC
              pages={allProjects}
              currentSlug={project.slug}
              basePath="/du-an"
              className="w-full md:w-fit min-w-52"
            /> */}
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
                {project.category?.name || "Dự án"}
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
          <PreviewContent
            content={project.description}
            hideFirstHeading={true}
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
