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

  // Fetch only the active project
  const project = await getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  const images = project.images || [];

  return (
    <main className="w-full pt-28 pb-24 px-4 md:px-6 min-h-screen">
      <div className="max-w-3xl mx-auto flex flex-col gap-6">
        {/* Title */}
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground leading-tight">
          {project.title}
        </h1>

        {/* Badge */}
        <div className="flex items-center ">
          <Badge variant="outline" className="h-8 w-50 rounded-md">
            <Sparkle
              data-icon="inline-start"
              className="text-amber-500 fill-amber-500"
            />
            <span className="text-foreground/60">
              Danh mục {project.category?.name || "Dự án"}
            </span>
          </Badge>
        </div>

        {/* Representative Cover Image */}
        {images[0] && (
          <div className="w-full mt-2 overflow-hidden rounded-sm border border-border/40">
            <AspectRatio ratio={16 / 9}>
              <Image
                src={images[0]}
                alt={project.title}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 768px"
              />
            </AspectRatio>
          </div>
        )}

        {/* Article Content */}
        <article className="mt-4">
          <PreviewContent
            content={project.description}
            hideFirstHeading={true}
          />

          {/* Additional Images */}
          {images.length > 1 && (
            <div className="mt-12 flex flex-col gap-8">
              {images.slice(1).map((img: string, i: number) => (
                <div
                  key={i}
                  className="w-full overflow-hidden rounded-sm border border-border/40"
                >
                  <AspectRatio ratio={3 / 2}>
                    <Image
                      src={img}
                      alt={`${project.title} - ảnh ${i + 1}`}
                      fill
                      className="object-contain bg-muted/10"
                      sizes="(max-width: 768px) 100vw, 768px"
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
