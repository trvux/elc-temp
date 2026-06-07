import { getProjects } from "@/modules/project/application/getProjects";
import { resolveProjectPath } from "@/modules/project/application/resolveProjectPath";
import { ProjectWithCategory } from "@/modules/project/domain/types";
import { ProjectListModule } from "@/modules/project/presentation/components/public/ProjectListModule";
import { getProjectTypes } from "@/modules/project-type/application";
import { PreviewContent } from "@/shared/components/layout/user/preview-content";
import { ScrollToTop } from "@/shared/components/layout/user/scroll-to-top";
import { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { AspectRatio } from "@/shared/components/ui/aspect-ratio";
import { Badge } from "@/shared/components/ui/badge";
import { Sparkle } from "lucide-react";
import { setUseStaticClient } from "@/shared/lib/supabase/server";
import { cacheLife } from "next/cache";

// Generate dynamic SEO Metadata
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const entity = await resolveProjectPath(slug);

  if (!entity) {
    return {
      title: "Không tìm thấy trang | ELC",
    };
  }

  if (entity.type === "project_type") {
    const st = entity.data;
    return {
      title: `${st.metaTitle || `Dự án ${st.name}`} | Điện máy ELC`,
      description:
        st.metaDescription ||
        `Tổng hợp các dự án, công trình thiết kế thi công hệ thống, điều hòa không khí cho ${st.name} tiêu biểu do ELC thực hiện.`,
    };
  }

  if (entity.type === "project") {
    const proj = entity.data;
    return {
      title: `${proj.metaTitle || proj.title} | Điện máy ELC`,
      description:
        proj.metaDescription ||
        `Chi tiết công trình ${proj.title} hoàn thiện lắp đặt hệ thống chuyên nghiệp bởi ELC.`,
    };
  }

  return {};
}

// Generate static parameters for high performance static pre-rendering
export async function generateStaticParams() {
  const projectTypes = await getProjectTypes();
  const projects = await getProjects({ isPublished: true });

  const projectTypeParams = projectTypes
    .filter((st) => st.slug && !st.deletedAt)
    .map((st) => ({
      slug: st.slug,
    }));

  const projectParams = projects
    .filter((p) => p.slug && !p.deletedAt)
    .map((p) => ({
      slug: p.slug,
    }));

  const params = [...projectTypeParams, ...projectParams];
  if (params.length === 0) {
    return [{ slug: "preview-stub" }];
  }
  return params;
}

interface ProjectDetailPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ProjectDetailPage({
  params,
  searchParams,
}: ProjectDetailPageProps) {
  const { slug } = await params;

  // Resolve the slug via the database slug registry
  const entity = await resolveProjectPath(slug);

  if (!entity) {
    notFound();
  }

  // Branch depending on entity type
  if (entity.type === "project_type") {
    const resolvedSearchParams = await searchParams;
    return (
      <ProjectListModule
        projectType={entity.data}
        searchParams={resolvedSearchParams}
      />
    );
  }

  if (entity.type === "project") {
    return <ProjectDetailView project={entity.data} />;
  }

  notFound();
}

async function getCachedCurrentYear() {
  "use cache";
  return new Date().getFullYear();
}

// Sub-component to render the Project Detail page view
async function ProjectDetailView({ project }: { project: ProjectWithCategory }) {
  const images = project.images || [];
  const displayCategory =
    project.categoriesNew?.[0]?.name || project.projectType?.name || "Dự án";

  const currentYear = await getCachedCurrentYear();

  return (
    <main className="w-full pt-28 pb-24 px-4 md:px-6 min-h-screen bg-background">
      <div className="max-w-3xl mx-auto flex flex-col gap-6 animate-fade-in-up">
        {/* Title */}
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground leading-tight">
          {project.title}
        </h1>

        {/* Badge */}
        <div className="flex items-center">
          <Badge
            variant="outline"
            className="h-8 rounded-md flex items-center gap-1.5 px-3 border-border bg-muted/20"
          >
            <Sparkle className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span className="text-xs font-medium text-muted-foreground">
              Danh mục: {displayCategory}
            </span>
          </Badge>
        </div>

        {/* Cover Image */}
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

        {/* Article content */}
        <article className="mt-4">
          <PreviewContent
            content={project.description}
            hideFirstHeading={true}
          />

          {/* Subsequent gallery images */}
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
                      alt={`${project.title} - ảnh ${i + 2}`}
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
          <span>© {currentYear} ELC</span>

          <ScrollToTop className="hover:text-foreground transition-colors">
            Trở lên đầu trang
          </ScrollToTop>
        </footer>
      </div>
    </main>
  );
}
