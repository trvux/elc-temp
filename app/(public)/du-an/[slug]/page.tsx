import { getProjects } from "@/modules/project/application/getProjects";
import { resolveProjectPath } from "@/modules/project/application/resolveProjectPath";
import { ProjectWithCategory } from "@/modules/project/domain/types";
import { ProjectListModule } from "@/modules/project/presentation/components/public/ProjectListModule";
import { getServiceTypes } from "@/modules/service-type/application";
import { ServiceTypeWithCategories } from "@/modules/service-type/domain/types";
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
import { Suspense } from "react";
import { Skeleton } from "@/shared/components/ui/skeleton";

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

  if (entity.type === "service_type") {
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
  const serviceTypes = await getServiceTypes();
  const projects = await getProjects({ isPublished: true });

  const serviceTypeParams = serviceTypes
    .filter((st) => st.slug && !st.deletedAt)
    .map((st) => ({
      slug: st.slug,
    }));

  const projectParams = projects
    .filter((p) => p.slug && !p.deletedAt)
    .map((p) => ({
      slug: p.slug,
    }));

  return [...serviceTypeParams, ...projectParams];
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
  if (entity.type === "service_type") {
    return (
      <Suspense fallback={<ProjectListSkeleton />}>
        <ProjectListModuleWrapper
          serviceType={entity.data}
          searchParamsPromise={searchParams}
        />
      </Suspense>
    );
  }

  if (entity.type === "project") {
    return (
      <Suspense fallback={<ProjectDetailSkeleton />}>
        <ProjectDetailView project={entity.data} />
      </Suspense>
    );
  }

  notFound();
}

function ProjectDetailSkeleton() {
  return (
    <main className="w-full pt-28 pb-24 px-4 md:px-6 min-h-screen bg-background animate-pulse">
      <div className="max-w-3xl mx-auto flex flex-col gap-6">
        {/* Title Skeleton */}
        <Skeleton className="h-12 w-3/4 rounded-lg bg-muted/40" />
        
        {/* Category Badge Skeleton */}
        <Skeleton className="h-8 w-40 rounded-md bg-muted/40" />

        {/* Image Skeleton */}
        <div className="w-full mt-2 overflow-hidden rounded-sm border border-border/40 aspect-[16/9] bg-muted/10" />

        {/* Content Skeleton Lines */}
        <div className="mt-8 space-y-4">
          <Skeleton className="h-4 w-full rounded bg-muted/40" />
          <Skeleton className="h-4 w-11/12 rounded bg-muted/40" />
          <Skeleton className="h-4 w-5/6 rounded bg-muted/40" />
          <div className="h-4" />
          <Skeleton className="h-4 w-full rounded bg-muted/40" />
          <Skeleton className="h-4 w-full rounded bg-muted/40" />
          <Skeleton className="h-4 w-3/4 rounded bg-muted/40" />
        </div>
      </div>
    </main>
  );
}

async function ProjectListModuleWrapper({
  serviceType,
  searchParamsPromise,
}: {
  serviceType: ServiceTypeWithCategories;
  searchParamsPromise: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParamsPromise;
  return (
    <ProjectListModule
      serviceType={serviceType}
      searchParams={resolvedSearchParams}
    />
  );
}

// Sub-component to render the Project Detail page view
async function ProjectDetailView({ project }: { project: ProjectWithCategory }) {
  "use cache";
  cacheLife("hours");
  setUseStaticClient(true);

  const images = project.images || [];
  const displayCategory =
    project.categoriesNew?.[0]?.name || project.serviceType?.name || "Dự án";

  const breadcrumbItems = [
    { label: "Dự án", href: "/du-an" },
    ...(project.serviceType
      ? [
          {
            label: project.serviceType.name,
            href: `/du-an/${project.serviceType.slug || ""}`,
          },
        ]
      : []),
    { label: project.title, active: true },
  ];

  return (
    <main className="w-full pt-28 pb-24 px-4 md:px-6 min-h-screen bg-background">
      <div className="max-w-3xl mx-auto flex flex-col gap-6 animate-fade-in-up">
        {/* Breadcrumbs
        <Breadcrumbs items={breadcrumbItems} /> */}

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

        {/* Cover Cover Image */}
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
          <span>© {new Date().getFullYear()} ELC</span>

          <ScrollToTop className="hover:text-foreground transition-colors">
            Trở lên đầu trang
          </ScrollToTop>
        </footer>
      </div>
    </main>
  );
}

function ProjectListSkeleton() {
  return (
    <main className="w-full px-4 py-12 md:px-8 bg-background min-h-screen">
      <div className="mx-auto w-full max-w-7xl flex flex-col gap-8 md:gap-12">
        {/* Breadcrumbs Skeleton */}
        <div className="h-4 w-32 bg-muted rounded animate-pulse" />

        {/* Header Skeleton */}
        <header className="flex flex-col items-center text-center gap-4 max-w-3xl mx-auto">
          <Skeleton className="h-10 w-64 md:w-96 rounded-lg" />
          <Skeleton className="h-6 w-48 rounded" />
        </header>

        {/* Filters and Grid Section Skeleton */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 w-full">
            <Skeleton className="h-10 flex-1 rounded-lg" />
            <Skeleton className="h-10 w-24 rounded-lg" />
          </div>

          <div className="flex flex-col lg:flex-row gap-12">
            {/* Sidebar Filter Skeleton */}
            <aside className="hidden lg:block w-64 shrink-0 space-y-6">
              <Skeleton className="h-8 w-24 rounded" />
              <div className="space-y-3">
                <Skeleton className="h-6 w-full rounded" />
                <Skeleton className="h-6 w-full rounded" />
                <Skeleton className="h-6 w-full rounded" />
              </div>
            </aside>

            {/* Project List Grid Skeleton */}
            <div className="flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10 md:gap-y-12 min-h-112.5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex flex-col gap-4 border border-border/40 rounded-xl p-0 overflow-hidden bg-white/50 shadow-sm h-87.5">
                    <Skeleton className="aspect-video w-full" />
                    <div className="p-5 flex-1 space-y-3">
                      <Skeleton className="h-6 w-3/4 rounded" />
                      <Skeleton className="h-4 w-full rounded" />
                      <Skeleton className="h-4 w-5/6 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
