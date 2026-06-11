import { GridSection } from "@/shared/components/sections/grid-section";
import { Skeleton } from "@/shared/components/ui/skeleton";

export default function InformationLoading() {
  return (
    <main className="w-full bg-background min-h-screen">
      {/* Section 1: Thong tin ve ELC Skeleton */}
      <GridSection
        id="info-section-loading"
        isFirst={true}
        showDiamond={true}
        contentClassName="py-12 md:py-16 lg:py-20 flex flex-col gap-12"
      >
        <header className="flex flex-col gap-6 max-w-2xl w-full mx-auto items-center text-center">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-6 w-full max-w-lg" />
        </header>

        <div className="flex flex-col justify-center gap-4 min-h-[200px] max-w-3xl w-full mx-auto">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="flex justify-between items-center p-6 border-b border-border last:border-b-0"
            >
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-5 w-5" />
            </div>
          ))}
        </div>
      </GridSection>

      {/* Section 2: Co so ha tang Skeleton */}
      <GridSection
        id="branches-section-loading"
        isFirst={false}
        showDiamond={true}
        contentClassName="py-12 md:py-16 lg:py-20 flex flex-col gap-12"
      >
        <header className="flex flex-col gap-6 max-w-2xl w-full mx-auto items-center text-center">
          <Skeleton className="h-10 w-56" />
          <Skeleton className="h-6 w-full max-w-lg" />
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl mx-auto">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex flex-col gap-4 p-6 border border-dashed rounded-2xl bg-card">
              <Skeleton className="h-6 w-3/4" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            </div>
          ))}
        </div>
      </GridSection>

      {/* Footer Section */}
      <GridSection
        id="info-footer-loading"
        isFirst={false}
        showDiamond={true}
        contentClassName="py-8"
      >
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 w-full">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-24" />
        </div>
      </GridSection>
    </main>
  );
}
