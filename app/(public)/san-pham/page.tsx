// import { searchProducts } from "@/modules/catalog/application";
// import { ProductCard } from "@/modules/catalog/presentation/components/ProductCard";
// import { ProductFilterMobile } from "@/modules/catalog/presentation/components/ProductFilterMobile";
// import { ProductFilters } from "@/modules/catalog/presentation/components/ProductFilters";
// import { getCategories } from "@/modules/category/application";
// import { Breadcrumbs } from "@/shared/components/layout/user/breadcrumbs";
// import { ProductPagination } from "@/shared/components/layout/user/product-pagination";
// import { ProductSearch } from "@/shared/components/layout/user/product-search";
// import { ScrollToTop } from "@/shared/components/layout/user/scroll-to-top";
// import { GridSection } from "@/shared/components/sections/grid-section";
// import { Skeleton } from "@/shared/components/ui/skeleton";
// import {
//   TypographyH1,
//   TypographyLarge,
//   TypographySmall,
// } from "@/shared/components/ui/typography";
// import { getQueryTokens } from "@/shared/lib/search-utils";
// import { generateCollectionSchema, SHOP_NAME } from "@/shared/lib/seo-utils";
// import { setUseStaticClient } from "@/shared/lib/supabase/server";
// import { cn } from "@/shared/lib/utils";
// import { Metadata } from "next";
// import { cacheLife, cacheTag } from "next/cache";
// import { Suspense } from "react";

// interface Props {
//   searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
// }

// export async function generateMetadata({
//   searchParams,
// }: Props): Promise<Metadata> {
//   const sParams = await searchParams;
//   const q =
//     typeof sParams.search === "string"
//       ? sParams.search.trim()
//       : typeof sParams.q === "string"
//         ? sParams.q.trim()
//         : "";
//   const brands =
//     typeof sParams.brands === "string"
//       ? [sParams.brands]
//       : Array.isArray(sParams.brands)
//         ? sParams.brands
//         : [];

//   const baseUrl =
//     process.env.NEXT_PUBLIC_APP_URL || "https://dienmayelc.com.vn";
//   const canonicalUrl = `${baseUrl}/san-pham`;

//   if (q) {
//     const title = `Kết quả tìm kiếm cho "${q}" | ${SHOP_NAME}`;
//     const description = `Tìm thấy các sản phẩm liên quan đến "${q}" tại ${SHOP_NAME}. Cam kết hàng chính hãng, giá tốt nhất, giao hàng nhanh.`;
//     return {
//       title,
//       description,
//       robots: { index: false, follow: true }, // Don't index search results
//     };
//   }

//   // Handle Brand SEO
//   if (brands.length === 1) {
//     const brandName = brands[0].charAt(0).toUpperCase() + brands[0].slice(1);
//     return {
//       title: `Danh sách sản phẩm ${brandName} chính hãng | ${SHOP_NAME}`,
//       description: `Khám phá các sản phẩm ${brandName} chính hãng tại ${SHOP_NAME}. Cam kết giá tốt nhất, bảo hành uy tín, hỗ trợ lắp đặt chuyên nghiệp.`,
//       alternates: {
//         canonical: canonicalUrl,
//       },
//     };
//   }

//   return {
//     title: `Danh sách sản phẩm Điện máy chính hãng | ${SHOP_NAME}`,
//     description: `Khám phá hàng ngàn sản phẩm điện máy chính hãng tại ${SHOP_NAME}. Máy lạnh, điều hòa, tủ lạnh, máy giặt giá tốt nhất, bảo hành uy tín.`,
//     alternates: {
//       canonical: canonicalUrl,
//     },
//   };
// }

// const STYLES = {
//   main: cn("w-full px-4 py-12 md:px-8"),
//   container: cn(
//     "mx-auto w-full px-4 md:px-6 max-w-7xl flex flex-col gap-6 md:gap-12",
//   ),
//   header: cn("flex flex-col items-center text-center gap-3"),
//   title: cn("w-full max-w-none! text-wrap!"),
//   searchWrapper: cn("w-full"),
//   grid: cn(
//     "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-6 md:gap-y-16 min-h-[450px] content-start animate-fade-in-up",
//   ),
//   productCard: cn("group flex flex-col"),
//   emptyState: cn("py-24 text-center min-h-[300px] animate-fade-in-up"),
//   emptyText: cn("text-muted-foreground/60 italic text-sm"),
//   paginationWrapper: cn("mt-4"),
//   footer: cn(
//     "border-t pt-12 flex flex-col md:flex-row justify-between items-center gap-8 text-muted-foreground",
//   ),
//   scrollToTop: cn(
//     "flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors",
//   ),
// };

// interface ProductsPageProps {
//   searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
// }

// export default async function ProductsPage({
//   searchParams,
// }: ProductsPageProps) {
//   return (
//     <Suspense fallback={<ProductListSkeleton />}>
//       <CachedProductsViewWrapper searchParamsPromise={searchParams} />
//     </Suspense>
//   );
// }

// async function CachedProductsViewWrapper({
//   searchParamsPromise,
// }: {
//   searchParamsPromise: Promise<{
//     [key: string]: string | string[] | undefined;
//   }>;
// }) {
//   const params = await searchParamsPromise;
//   return <CachedProductsView params={params} />;
// }

// async function CachedProductsView({
//   params,
// }: {
//   params: { [key: string]: string | string[] | undefined };
// }) {
//   "use cache";
//   // Set stale: 0 so the browser always asks the server on reload,
//   // but keep revalidate/expire so the server itself caches it.
//   cacheLife({ stale: 0, revalidate: 300, expire: 86400 });
//   cacheTag("products");
//   setUseStaticClient(true);

//   const q =
//     typeof params.search === "string"
//       ? params.search.trim()
//       : typeof params.q === "string"
//         ? params.q.trim()
//         : "";
//   const minPrice =
//     typeof params.minPrice === "string" && params.minPrice
//       ? Number(params.minPrice)
//       : undefined;
//   const maxPrice =
//     typeof params.maxPrice === "string" && params.maxPrice
//       ? Number(params.maxPrice)
//       : undefined;
//   const currentPage = Number(params.page) || 1;
//   const pageSize = 12;

//   const brandSlugs = Array.isArray(params.brands)
//     ? params.brands
//     : typeof params.brands === "string"
//       ? [params.brands]
//       : [];
//   const brandIds = Array.isArray(params.brandIds)
//     ? params.brandIds
//     : typeof params.brandIds === "string"
//       ? [params.brandIds]
//       : [];

//   const specs: Record<string, string[]> = {};
//   Object.keys(params).forEach((key) => {
//     if (key.startsWith("spec_")) {
//       const label = key.replace("spec_", "");
//       const val = params[key];
//       specs[label] = Array.isArray(val)
//         ? val
//         : typeof val === "string"
//           ? [val]
//           : [];
//     }
//   });

//   const allCategories = await getCategories({ type: "PRODUCT" });
//   const queryTokens = getQueryTokens(q);

//   const { products, totalCount, availableFilters } = await searchProducts(q, {
//     isPublished: true,
//     minPrice,
//     maxPrice,
//     brandIds,
//     brandSlugs,
//     specs,
//     limit: pageSize,
//     offset: (currentPage - 1) * pageSize,
//   });

//   const totalPages = Math.ceil(totalCount / pageSize);

//   return (
//     <main className={STYLES.main}>
//       <div className={STYLES.container}>
//         <Breadcrumbs items={[{ label: "Sản phẩm", active: true }]} />

//         <header className={STYLES.header}>
//           <TypographyH1 className={STYLES.title}>
//             {q ? `Kết quả cho "${q}"` : "Tất cả sản phẩm"}
//           </TypographyH1>
//           <TypographyLarge className="flex items-center gap-x-1 text-sm! md:text-md! lg:text-lg! text-muted-foreground">
//             Danh sách{" "}
//             <span className="flex gap-x-1 bg-blue-100 text-blue-800 px-2 rounded-sm items-center">
//               {totalCount} sản phẩm
//             </span>{" "}
//             đáp ứng tiêu chí
//           </TypographyLarge>
//         </header>

//         <GridSection id="products-catalog" showDiamond={true}>
//           <div className="flex flex-col gap-4">
//             <div className="flex items-center gap-3 w-full">
//               <div className="flex-1">
//                 <Suspense fallback={null}>
//                   <ProductSearch />
//                 </Suspense>
//               </div>
//               <ProductFilterMobile
//                 categories={allCategories}
//                 availableFilters={availableFilters}
//               />
//             </div>

//             <div className="flex flex-col lg:flex-row gap-12">
//               <aside className="hidden lg:block w-64 shrink-0 sticky top-28 self-start">
//                 <ProductFilters
//                   categories={allCategories}
//                   availableFilters={availableFilters}
//                 />
//               </aside>

//               <div className="flex-1">
//                 {products.length > 0 ? (
//                   <div className={STYLES.grid}>
//                     {products.map((product, index) => (
//                       <ProductCard
//                         key={product.id}
//                         product={product}
//                         queryTokens={queryTokens}
//                         priority={index < 8}
//                       />
//                     ))}
//                   </div>
//                 ) : (
//                   <div className={STYLES.emptyState}>
//                     <p className={STYLES.emptyText}>
//                       Không tìm thấy sản phẩm phù hợp.
//                     </p>
//                   </div>
//                 )}

//                 {totalPages > 1 && (
//                   <div className={STYLES.paginationWrapper}>
//                     <ProductPagination
//                       currentPage={currentPage}
//                       totalPages={totalPages}
//                       searchParams={params}
//                     />
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>
//         </GridSection>
//         <footer className={STYLES.footer}>
//           <TypographySmall>
//             &copy; {new Date().getFullYear()} ELC Holdings. Đã đăng ký bản
//             quyền.
//           </TypographySmall>
//           <ScrollToTop className={STYLES.scrollToTop}>
//             <TypographySmall>Quay lại đầu trang</TypographySmall>
//           </ScrollToTop>
//         </footer>
//       </div>

//       {/* Structured Data for Google SEO */}
//       {(() => {
//         const schema = generateCollectionSchema(
//           {
//             name: "Tất cả sản phẩm điện máy",
//             slug: "san-pham",
//             description:
//               "Danh sách tổng hợp các sản phẩm máy lạnh, máy lọc không khí và thiết bị điện máy chính hãng tại Điện máy ELC.",
//           },
//           products,
//         );
//         if (!schema) return null;
//         return (
//           <script
//             type="application/ld+json"
//             dangerouslySetInnerHTML={{
//               __html: JSON.stringify(schema),
//             }}
//           />
//         );
//       })()}
//     </main>
//   );
// }

// function ProductListSkeleton() {
//   return (
//     <main className="w-full px-4 py-12 md:px-8 bg-background min-h-screen">
//       <div className="mx-auto w-full max-w-7xl flex flex-col gap-8 md:gap-12">
//         {/* Breadcrumbs Skeleton */}
//         <div className="h-4 w-32 bg-muted rounded animate-pulse" />

//         {/* Header Skeleton */}
//         <header className="flex flex-col items-center text-center gap-4 max-w-3xl mx-auto">
//           <Skeleton className="h-10 w-64 md:w-96 rounded-lg" />
//           <Skeleton className="h-6 w-48 rounded" />
//         </header>

//         {/* Filters and Grid Section Skeleton */}
//         <div className="flex flex-col gap-4">
//           <div className="flex items-center gap-3 w-full">
//             <Skeleton className="h-10 flex-1 rounded-lg" />
//             <Skeleton className="h-10 w-24 rounded-lg" />
//           </div>

//           <div className="flex flex-col lg:flex-row gap-12">
//             {/* Sidebar Filter Skeleton */}
//             <aside className="hidden lg:block w-64 shrink-0 space-y-6">
//               <Skeleton className="h-8 w-24 rounded" />
//               <div className="space-y-3">
//                 <Skeleton className="h-6 w-full rounded" />
//                 <Skeleton className="h-6 w-full rounded" />
//                 <Skeleton className="h-6 w-full rounded" />
//               </div>
//             </aside>

//             {/* Product List Grid Skeleton */}
//             <div className="flex-1">
//               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-6 md:gap-y-16 min-h-112.5">
//                 {Array.from({ length: 8 }).map((_, i) => (
//                   <div
//                     key={i}
//                     className="flex flex-col border border-border/40 rounded-xl p-0 overflow-hidden bg-white shadow-sm h-87.5 animate-pulse"
//                   >
//                     <Skeleton className="aspect-video w-full" />
//                     <div className="p-3 md:p-6 flex-1 flex flex-col gap-3">
//                       <Skeleton className="h-6 w-3/4 rounded" />
//                       <Skeleton className="h-4 w-1/2 rounded" />
//                       <Skeleton className="h-8 w-1/3 rounded mt-auto" />
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </main>
//   );
// }

import { searchProducts } from "@/modules/catalog/application";
import { ProductCard } from "@/modules/catalog/presentation/components/ProductCard";
import { ProductFilterMobile } from "@/modules/catalog/presentation/components/ProductFilterMobile";
import { ProductFilters } from "@/modules/catalog/presentation/components/ProductFilters";
import { getCategories } from "@/modules/category/application";
import { Breadcrumbs } from "@/shared/components/layout/user/breadcrumbs";
import { ProductPagination } from "@/shared/components/layout/user/product-pagination";
import { ProductSearch } from "@/shared/components/layout/user/product-search";
import { ScrollToTop } from "@/shared/components/layout/user/scroll-to-top";
import { GridSection } from "@/shared/components/sections/grid-section";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  TypographyH1,
  TypographyLarge,
  TypographySmall,
} from "@/shared/components/ui/typography";
import { getQueryTokens } from "@/shared/lib/search-utils";
import { generateCollectionSchema, SHOP_NAME } from "@/shared/lib/seo-utils";
import { setUseStaticClient } from "@/shared/lib/supabase/server";
import { cn } from "@/shared/lib/utils";
import { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import { Suspense } from "react";

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({
  searchParams,
}: Props): Promise<Metadata> {
  const sParams = await searchParams;
  const q =
    typeof sParams.search === "string"
      ? sParams.search.trim()
      : typeof sParams.q === "string"
        ? sParams.q.trim()
        : "";
  const brands =
    typeof sParams.brands === "string"
      ? [sParams.brands]
      : Array.isArray(sParams.brands)
        ? sParams.brands
        : [];

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://dienmayelc.com.vn";
  const canonicalUrl = `${baseUrl}/san-pham`;

  if (q) {
    const title = `Kết quả tìm kiếm cho "${q}" | ${SHOP_NAME}`;
    const description = `Tìm thấy các sản phẩm liên quan đến "${q}" tại ${SHOP_NAME}. Cam kết hàng chính hãng, giá tốt nhất, giao hàng nhanh.`;
    return {
      title,
      description,
      robots: { index: false, follow: true },
    };
  }

  if (brands.length === 1) {
    const brandName = brands[0].charAt(0).toUpperCase() + brands[0].slice(1);
    return {
      title: `Danh sách sản phẩm ${brandName} chính hãng | ${SHOP_NAME}`,
      description: `Khám phá các sản phẩm ${brandName} chính hãng tại ${SHOP_NAME}. Cam kết giá tốt nhất, bảo hành uy tín, hỗ trợ lắp đặt chuyên nghiệp.`,
      alternates: {
        canonical: canonicalUrl,
      },
    };
  }

  return {
    title: `Danh sách sản phẩm Điện máy chính hãng | ${SHOP_NAME}`,
    description: `Khám phá hàng ngàn sản phẩm điện máy chính hãng tại ${SHOP_NAME}. Máy lạnh, điều hòa, tủ lạnh, máy giặt giá tốt nhất, bảo hành uy tín.`,
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

const STYLES = {
  main: cn("w-full bg-background min-h-screen flex flex-col"),
  header: cn("flex flex-col items-center text-center gap-3 w-full"),
  title: cn("w-full max-w-none! text-wrap!"),
  grid: cn(
    "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-6 md:gap-y-16 min-h-[450px] content-start animate-fade-in-up",
  ),
  emptyState: cn("py-24 text-center min-h-[300px] w-full animate-fade-in-up"),
  emptyText: cn("text-muted-foreground/60 italic text-sm"),
  paginationWrapper: cn("mt-12"),
  footer: cn(
    "w-full flex flex-col md:flex-row justify-between items-center gap-6 text-muted-foreground",
  ),
  scrollToTop: cn(
    "flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors",
  ),
};

interface ProductsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ProductsPage({
  searchParams,
}: ProductsPageProps) {
  return (
    <Suspense fallback={<ProductListSkeleton />}>
      <CachedProductsViewWrapper searchParamsPromise={searchParams} />
    </Suspense>
  );
}

async function CachedProductsViewWrapper({
  searchParamsPromise,
}: {
  searchParamsPromise: Promise<{
    [key: string]: string | string[] | undefined;
  }>;
}) {
  const params = await searchParamsPromise;
  return <CachedProductsView params={params} />;
}

async function CachedProductsView({
  params,
}: {
  params: { [key: string]: string | string[] | undefined };
}) {
  "use cache";
  cacheLife({ stale: 0, revalidate: 300, expire: 86400 });
  cacheTag("products");
  setUseStaticClient(true);

  const q =
    typeof params.search === "string"
      ? params.search.trim()
      : typeof params.q === "string"
        ? params.q.trim()
        : "";
  const minPrice =
    typeof params.minPrice === "string" && params.minPrice
      ? Number(params.minPrice)
      : undefined;
  const maxPrice =
    typeof params.maxPrice === "string" && params.maxPrice
      ? Number(params.maxPrice)
      : undefined;
  const currentPage = Number(params.page) || 1;
  const pageSize = 12;

  const brandSlugs = Array.isArray(params.brands)
    ? params.brands
    : typeof params.brands === "string"
      ? [params.brands]
      : [];
  const brandIds = Array.isArray(params.brandIds)
    ? params.brandIds
    : typeof params.brandIds === "string"
      ? [params.brandIds]
      : [];

  const specs: Record<string, string[]> = {};
  Object.keys(params).forEach((key) => {
    if (key.startsWith("spec_")) {
      const label = key.replace("spec_", "");
      const val = params[key];
      specs[label] = Array.isArray(val)
        ? val
        : typeof val === "string"
          ? [val]
          : [];
    }
  });

  const allCategories = await getCategories({ type: "PRODUCT" });
  const queryTokens = getQueryTokens(q);

  const { products, totalCount, availableFilters } = await searchProducts(q, {
    isPublished: true,
    minPrice,
    maxPrice,
    brandIds,
    brandSlugs,
    specs,
    limit: pageSize,
    offset: (currentPage - 1) * pageSize,
  });

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <main className={STYLES.main}>
      {/* ===== KHỐI 1: TIÊU ĐỀ TRANG ===== */}
      <GridSection
        id="products-header"
        isFirst={true}
        showDiamond={true}
        contentClassName="py-6 md:py-8 lg:py-10"
      >
        <div className="flex flex-col gap-6 w-full">
          <header className={STYLES.header}>
            <TypographyH1 className={STYLES.title}>
              {q ? `Kết quả cho "${q}"` : "Tất cả sản phẩm"}
            </TypographyH1>
            <TypographyLarge className="flex items-center gap-x-1 text-sm! md:text-md! lg:text-lg! text-muted-foreground">
              Danh sách{" "}
              <span className="flex gap-x-1 bg-primary text-primary-foreground px-2 rounded-sm items-center font-medium">
                {totalCount} sản phẩm
              </span>{" "}
              đáp ứng tiêu chí
            </TypographyLarge>
          </header>
        </div>
      </GridSection>

      {/* ===== KHỐI 2: THANH TÌM KIẾM + BỘ LỌC + GRID SẢN PHẨM ===== */}
      <GridSection
        id="products-search"
        isFirst={false}
        showDiamond={true}
        contentClassName="py-6 md:py-8 lg:py-10"
      >
        <div className="flex flex-col gap-8 w-full">
          {/* Ô Tìm kiếm & Mobile filter */}
          <div className="flex items-center gap-3 w-full">
            <div className="flex-1">
              <Suspense fallback={null}>
                <ProductSearch />
              </Suspense>
            </div>
            <ProductFilterMobile
              categories={allCategories}
              availableFilters={availableFilters}
            />
          </div>
        </div>
      </GridSection>

      {/* Thân trang */}
      <GridSection
        id="products-content"
        isFirst={false}
        showDiamond={true}
        contentClassName="py-6 md:py-8 lg:py-10"
      >
        <div className="flex flex-col lg:flex-row gap-12 w-full items-start">
          {/* Bộ lọc cố định bên trái Desktop */}
          <aside className="hidden lg:block w-64 shrink-0 sticky top-28 self-start">
            <ProductFilters
              categories={allCategories}
              availableFilters={availableFilters}
            />
          </aside>

          {/* Lưới sản phẩm */}
          <div className="flex-1 w-full">
            {products.length > 0 ? (
              <div className={STYLES.grid}>
                {products.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    queryTokens={queryTokens}
                    priority={index < 8}
                  />
                ))}
              </div>
            ) : (
              <div className={STYLES.emptyState}>
                <p className={STYLES.emptyText}>
                  Không tìm thấy sản phẩm phù hợp.
                </p>
              </div>
            )}

            {totalPages > 1 && (
              <div className={STYLES.paginationWrapper}>
                <ProductPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  searchParams={params}
                />
              </div>
            )}
          </div>
        </div>
      </GridSection>

      {/* ===== KHỐI 4: THANH BẢN QUYỀN FOOTER TRANG ===== */}
      <GridSection
        id="products-footer"
        isFirst={false}
        showDiamond={true}
        contentClassName="py-6 md:py-8 lg:py-10"
      >
        <footer className={STYLES.footer}>
          <TypographySmall>
            &copy; {new Date().getFullYear()} ELC Holdings. Đã đăng ký bản
            quyền.
          </TypographySmall>
          <ScrollToTop className={STYLES.scrollToTop}>
            <TypographySmall>Quay lại đầu trang</TypographySmall>
          </ScrollToTop>
        </footer>
      </GridSection>

      {/* ===== KHỐI 3: BREADCRUMBS (Nằm dưới Catalog, khít chiều cao, đủ 4 góc gạch đứt) ===== */}
      <GridSection
        id="products-breadcrumbs"
        isFirst={false}
        showDiamond={false}
        contentClassName="py-1"
      >
        <div className="w-full">
          <Breadcrumbs items={[{ label: "Sản phẩm", active: true }]} />
        </div>
      </GridSection>

      {/* Dữ liệu cấu trúc Schema SEO */}
      {(() => {
        const schema = generateCollectionSchema(
          {
            name: "Tất cả sản phẩm điện máy",
            slug: "san-pham",
            description:
              "Danh sách tổng hợp các sản phẩm máy lạnh, máy lọc không khí và thiết bị điện máy chính hãng tại Điện máy ELC.",
          },
          products,
        );
        if (!schema) return null;
        return (
          <div style={{ display: "none" }}>
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify(schema),
              }}
            />
          </div>
        );
      })()}
    </main>
  );
}

function ProductListSkeleton() {
  return (
    <main className="w-full bg-background min-h-screen">
      <div className="mx-auto w-full max-w-350 min-[112.5rem]:max-w-384 px-4 md:px-6 lg:px-8 pt-12 flex flex-col gap-6">
        <header className="flex flex-col items-center text-center gap-4 max-w-3xl mx-auto w-full">
          <Skeleton className="h-10 w-64 md:w-96 rounded-lg" />
          <Skeleton className="h-6 w-48 rounded" />
        </header>
      </div>

      <div className="mx-auto w-full max-w-350 min-[112.5rem]:max-w-384 px-4 md:px-6 lg:px-8 py-16 flex flex-col gap-8">
        <div className="flex items-center gap-3 w-full">
          <Skeleton className="h-10 flex-1 rounded-lg" />
          <Skeleton className="h-10 w-24 rounded-lg" />
        </div>

        <div className="flex flex-col lg:flex-row gap-12 w-full items-start">
          <aside className="hidden lg:block w-64 shrink-0 space-y-6">
            <Skeleton className="h-8 w-24 rounded" />
            <div className="space-y-3">
              <Skeleton className="h-6 w-full rounded" />
              <Skeleton className="h-6 w-full rounded" />
              <Skeleton className="h-6 w-full rounded" />
            </div>
          </aside>

          <div className="flex-1 w-full">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-6 md:gap-y-16">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="flex flex-col border border-border/40 rounded-xl p-0 overflow-hidden bg-white shadow-sm h-[350px] animate-pulse"
                >
                  <Skeleton className="aspect-video w-full" />
                  <div className="p-4 flex-1 flex flex-col gap-3">
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
    </main>
  );
}
