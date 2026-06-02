import { ProjectListModule } from "@/modules/project/presentation/components/public/ProjectListModule";
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
                  <div
                    key={i}
                    className="flex flex-col gap-4 border border-border/40 rounded-xl p-0 overflow-hidden bg-white/50 shadow-sm h-87.5"
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
        </div>
      </div>
    </main>
  );
}
