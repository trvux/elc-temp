import { GridSection } from "@/shared/components/sections/grid-section";
import { Skeleton } from "@/shared/components/ui/skeleton";

export default function ServicesLoading() {
  return (
    <main className="w-full bg-background flex flex-col flex-1">
      {/* Services Header Skeleton */}
      <GridSection
        id="services-header-loading"
        isFirst={true}
        showDiamond={true}
        contentClassName="py-6 md:py-8 lg:py-10"
      >
        <div className="flex flex-col gap-6 max-w-2xl w-full mx-auto items-center text-center">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-6 w-full max-w-lg" />
        </div>
      </GridSection>

      {/* Services Content Skeleton */}
      <GridSection
        id="services-content-loading"
        isFirst={false}
        showDiamond={true}
        contentClassName="py-6 md:py-8 lg:py-10"
      >
        <div className="w-full flex flex-col items-center gap-6">
          {/* TabsList Skeleton */}
          <div className="flex w-full justify-start md:justify-center overflow-x-auto gap-2 mb-6">
            <Skeleton className="h-10 w-32 rounded-md" />
            <Skeleton className="h-10 w-32 rounded-md" />
            <Skeleton className="h-10 w-32 rounded-md" />
          </div>

          {/* Cards Grid Skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 w-full">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="flex flex-col gap-4 p-4 border border-dashed rounded-2xl bg-card">
                <Skeleton className="aspect-video w-full rounded-xl" />
                <div className="space-y-2 mt-2">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </GridSection>

      {/* Footer Skeleton */}
      <GridSection
        id="services-footer-loading"
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
