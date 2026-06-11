import { Skeleton } from "@/shared/components/ui/skeleton";

export default function NewsLoading() {
  return (
    <main className="w-full min-h-screen py-12 px-4 md:px-8 bg-background">
      <div className="max-w-5xl mx-auto flex flex-col gap-24">
        {/* News Header Skeleton */}
        <header className="flex flex-col gap-6 max-w-2xl w-full mx-auto items-center text-center">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-6 w-full max-w-lg" />
        </header>

        {/* News Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16 min-h-[400px]">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex flex-col gap-6 w-full">
              {/* Image Skeleton */}
              <Skeleton className="relative aspect-video rounded-2xl w-full" />
              
              {/* Content Skeleton */}
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-start gap-4">
                  <Skeleton className="h-7 w-3/4" />
                  <Skeleton className="h-6 w-6 rounded-full" />
                </div>
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          ))}
        </div>

        {/* Footer Skeleton */}
        <footer className="border-t pt-12 flex flex-col md:flex-row justify-between items-center gap-8 text-muted-foreground">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-24" />
        </footer>
      </div>
    </main>
  );
}
