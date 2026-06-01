import { resolveProductPath, ResolvedEntity } from "@/modules/catalog/application/resolveProductPath";
import { ProductDetailModule } from "@/modules/catalog/presentation/components/public/ProductDetailModule";
import { ProductListModule } from "@/modules/catalog/presentation/components/public/ProductListModule";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { generateProductMetadata, generateCategoryMetadata, generateBrandMetadata, SHOP_NAME } from "@/shared/lib/seo-utils";
import { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";
import { ProductWithRelations } from "@/modules/catalog/domain";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata(
  { params, searchParams }: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { slug } = await params;
  const resolved = await resolveProductPath(slug);

  if (!resolved) return {};

  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://dienmayelc.com.vn").replace(/\/$/, "");
  const previousImages = (await parent).openGraph?.images || [];

  switch (resolved.type) {
    case "product": {
      const product = resolved.data;
      const seoMetadata = generateProductMetadata(product);
      return {
        ...seoMetadata,
        alternates: { canonical: `${baseUrl}/san-pham/${slug}` },
        openGraph: {
          ...seoMetadata.openGraph,
          images: [...(seoMetadata.openGraph?.images || []), ...previousImages],
        },
      } as Metadata;
    }

    case "group":
    case "category": {
      const category = resolved.data;
      const sParams = await searchParams;
      const brands = typeof sParams.brands === "string" ? [sParams.brands] : Array.isArray(sParams.brands) ? sParams.brands : [];
      
      let seoMetadata = generateCategoryMetadata(category as any, 0); // Count can be added if needed
      
      if (brands.length === 1) {
        const brandName = brands[0]; // Normally we'd fetch the exact brand name here, simplified for now
        const title = `Danh sách ${category.name} ${brandName} chính hãng, giá tốt nhất | ${SHOP_NAME}`;
        const description = `Mua ${category.name} ${brandName} chính hãng tại Điện máy ELC. Cam kết chất lượng cao, bảo hành lâu dài, lắp đặt chuyên nghiệp, giá rẻ nhất thị trường.`;
        
        seoMetadata = {
          ...seoMetadata,
          title,
          description,
          openGraph: {
            ...seoMetadata.openGraph,
            title,
            description,
            images: seoMetadata.openGraph?.images || [],
            type: seoMetadata.openGraph?.type || "website",
          }
        };
      }

      return {
        ...seoMetadata,
        alternates: { canonical: `${baseUrl}/san-pham/${slug}` },
        openGraph: {
          ...seoMetadata.openGraph,
          images: [...(seoMetadata.openGraph?.images || []), ...previousImages],
        }
      } as Metadata;
    }

    case "brand": {
      const brandMetadata = generateBrandMetadata(resolved.data as any);
      return {
        ...brandMetadata,
        alternates: { canonical: `${baseUrl}/san-pham/${slug}` },
      };
    }
  }

  return {};
}

import { Suspense } from "react";

export default async function FlatSlugPage({ params, searchParams }: Props) {
  const { slug } = await params;

  const resolved = await resolveProductPath(slug);

  if (!resolved) {
    notFound();
  }

  if (resolved.type === "product") {
    return (
      <Suspense fallback={<ProductDetailSkeleton />}>
        <ProductDetailModule product={resolved.data as ProductWithRelations} />
      </Suspense>
    );
  }

  // If group, category, or brand, use ProductListModule
  return (
    <Suspense fallback={<ProductListSkeleton />}>
      <ProductListModuleWrapper
        entity={resolved}
        searchParamsPromise={searchParams}
      />
    </Suspense>
  );
}

async function ProductListModuleWrapper({
  entity,
  searchParamsPromise,
}: {
  entity: ResolvedEntity;
  searchParamsPromise: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParamsPromise;
  return <ProductListModule entity={entity} searchParams={resolvedSearchParams} />;
}

function ProductListSkeleton() {
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

            {/* Product List Grid Skeleton */}
            <div className="flex-1">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-6 md:gap-y-16 min-h-112.5">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex flex-col border border-border/40 rounded-xl p-0 overflow-hidden bg-white shadow-sm h-87.5 animate-pulse">
                    <Skeleton className="aspect-video w-full" />
                    <div className="p-3 md:p-6 flex-1 flex flex-col gap-3">
                      <Skeleton className="h-6 w-3/4 rounded" />
                      <Skeleton className="h-4 w-1/2 rounded" />
                      <Skeleton className="h-8 w-1/3 rounded mt-auto" />
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

function ProductDetailSkeleton() {
  return (
    <main className="min-h-screen w-full px-4 py-12 md:px-8 mt-16 animate-pulse">
      <div className="mx-auto w-full max-w-7xl flex flex-col gap-16">
        {/* Breadcrumbs Skeleton */}
        <div className="h-4 w-64 bg-muted rounded" />

        {/* Top Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
          {/* Left Column: Image Gallery Skeleton */}
          <div className="w-full aspect-[16/9] border border-border/50 rounded-2xl bg-muted/10 overflow-hidden" />

          {/* Right Column: Info Skeleton */}
          <div className="flex flex-col gap-4 h-full justify-center">
            <Skeleton className="h-6 w-32 rounded bg-muted/40" />
            <Skeleton className="h-10 w-full rounded-lg bg-muted/40" />
            <Skeleton className="h-10 w-2/3 rounded-lg bg-muted/40" />
            <Skeleton className="h-4 w-40 rounded bg-muted/40" />
            <Skeleton className="h-12 w-48 rounded bg-muted/40 mt-4" />
            <Skeleton className="h-12 w-full rounded-xl bg-muted/40 mt-6" />
          </div>
        </div>
      </div>
    </main>
  );
}
