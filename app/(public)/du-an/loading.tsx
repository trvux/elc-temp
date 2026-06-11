import { GridSection } from "@/shared/components/sections/grid-section";
import { Skeleton } from "@/shared/components/ui/skeleton";

export default function ProjectsLoading() {
  return (
    <main className="w-full bg-background min-h-screen flex flex-col">
      {/* Projects Header Skeleton */}
      <GridSection
        id="projects-header-loading"
        isFirst={true}
        showDiamond={true}
        contentClassName="py-6 md:py-8 lg:py-10"
      >
        <div className="flex flex-col gap-6 w-full items-center text-center">
          <Skeleton className="h-10 w-64 md:w-96" />
        </div>
      </GridSection>

      {/* Projects Search Skeleton */}
      <GridSection
        id="projects-search-loading"
        isFirst={false}
        showDiamond={true}
        contentClassName="py-6 md:py-8 lg:py-10"
      >
        <div className="flex items-center gap-3 w-full">
          <Skeleton className="h-10 flex-1 rounded-md" />
          <Skeleton className="h-10 w-24 rounded-md lg:hidden" />
        </div>
      </GridSection>

      {/* Projects Content Skeleton */}
      <GridSection
        id="projects-content-loading"
        isFirst={false}
        showDiamond={true}
        contentClassName="py-6 md:py-8 lg:py-10"
      >
        <div className="flex flex-col lg:flex-row gap-12 w-full items-start">
          {/* Sidebar Filter Skeleton (Desktop) */}
          <aside className="hidden lg:flex flex-col gap-6 w-64 shrink-0">
            <div className="space-y-4">
              <Skeleton className="h-6 w-32" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-4/5" />
                <Skeleton className="h-5 w-3/4" />
              </div>
            </div>
            <div className="space-y-4">
              <Skeleton className="h-6 w-28" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-5/6" />
              </div>
            </div>
          </aside>

          {/* Project Grid Skeleton */}
          <div className="flex-1 w-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10 md:gap-y-12 min-h-[450px]">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="flex flex-col gap-4">
                  <Skeleton className="aspect-video w-full rounded-2xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </GridSection>

      {/* Footer Skeleton */}
      <GridSection
        id="projects-footer-loading"
        isFirst={false}
        showDiamond={true}
        contentClassName="py-6 md:py-8 lg:py-10"
      >
        <div className="w-full flex flex-col md:flex-row justify-between items-center gap-6">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-24" />
        </div>
      </GridSection>
    </main>
  );
}
