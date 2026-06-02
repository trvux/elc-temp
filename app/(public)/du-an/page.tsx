import { ProjectListModule } from "@/modules/project/presentation/components/public/ProjectListModule";
import { GridSection } from "@/shared/components/sections/grid-section";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Suspense } from "react";

export const metadata = {
  title: "Dự án tiêu biểu | Điện máy ELC",
  description:
    "Tổng hợp các công trình tiêu biểu, biệt thự sang trọng, tòa nhà văn phòng, căn hộ cao cấp do ELC tư vấn thiết kế và trực tiếp thi công lắp đặt.",
};

interface ProjectsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ProjectsPage({
  searchParams,
}: ProjectsPageProps) {
  return (
    <Suspense fallback={<ProjectListSkeleton />}>
      <ProjectListModuleWrapper searchParamsPromise={searchParams} />
    </Suspense>
  );
}

async function ProjectListModuleWrapper({
  searchParamsPromise,
}: {
  searchParamsPromise: Promise<{
    [key: string]: string | string[] | undefined;
  }>;
}) {
  const resolvedSearchParams = await searchParamsPromise;
  return (
    <ProjectListModule serviceType={null} searchParams={resolvedSearchParams} />
  );
}

function ProjectListSkeleton() {
  return (
    <main className="w-full bg-background min-h-screen">
      <GridSection
        id="projects-header-skeleton"
        isFirst={true}
        showDiamond={true}
        contentClassName="py-6 md:py-8 lg:py-10"
      >
        <header className="flex flex-col items-center text-center gap-4 max-w-4xl mx-auto">
          <Skeleton className="h-10 w-64 md:w-96 rounded-lg" />
        </header>
      </GridSection>

      <GridSection
        id="projects-search-skeleton"
        isFirst={false}
        showDiamond={true}
        contentClassName="py-6 md:py-8 lg:py-10"
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 w-full">
            <Skeleton className="h-10 flex-1 rounded-lg" />
            <Skeleton className="h-10 w-24 rounded-lg" />
          </div>
        </div>
      </GridSection>

      <GridSection
        id="projects-content-skeleton"
        isFirst={false}
        showDiamond={true}
        contentClassName="py-6 md:py-8 lg:py-10"
      >
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Sidebar Filter Skeleton */}
          <aside className="hidden lg:block w-64 shrink-0 space-y-6 sticky top-28 self-start">
            <Skeleton className="h-8 w-24 rounded" />
            <div className="space-y-3">
              <Skeleton className="h-6 w-full rounded" />
              <Skeleton className="h-6 w-full rounded" />
              <Skeleton className="h-6 w-full rounded" />
            </div>
          </aside>

          {/* Project List Grid Skeleton */}
          <div className="flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10 md:gap-y-12 min-h-[450px]">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="flex flex-col gap-4 border border-border/40 rounded-xl p-0 overflow-hidden bg-white/50 shadow-sm h-[350px]"
                >
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
      </GridSection>

      <GridSection
        id="projects-footer-skeleton"
        isFirst={false}
        showDiamond={true}
        contentClassName="py-6 md:py-8 lg:py-10"
      >
        <div className="w-full flex flex-col md:flex-row justify-between items-center gap-6 text-muted-foreground">
          <Skeleton className="h-4 w-48 rounded" />
          <Skeleton className="h-4 w-32 rounded" />
        </div>
      </GridSection>

      <GridSection
        id="projects-breadcrumbs-skeleton"
        isFirst={false}
        showDiamond={false}
        contentClassName="py-1"
      >
        <Skeleton className="h-4 w-32 rounded" />
      </GridSection>
    </main>
  );
}
