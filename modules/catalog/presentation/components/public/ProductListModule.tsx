import { getProductsAction } from "@/modules/catalog/presentation/actions";
import { PRODUCT_STATUS } from "@/modules/catalog/domain";
import { ProductCard } from "@/modules/catalog/presentation/components/ProductCard";
import { ResolvedEntity } from "@/modules/catalog/presentation/resolveProductPath";
import { getCategoriesAction } from "@/modules/category/presentation/actions";
import { Breadcrumbs } from "@/shared/components/layout/user/breadcrumbs";
import { RecentlyViewedSection } from "@/shared/components/layout/user/recently-viewed-section";
import { ScrollToTop } from "@/shared/components/layout/user/scroll-to-top";
import { TypographyH1, TypographySmall } from "@/shared/components/ui/typography";
import { unwrapActionResult } from "@/shared/lib/action-result";
import { BASE_URL } from "@/shared/lib/seo-schema";
import { cn } from "@/shared/lib/utils";
import { notFound } from "next/navigation";

import { GridSection } from "@/shared/components/sections/grid-section";

const GRID_CLASS =
  "grid gap-x-4 gap-y-6 md:gap-y-12 content-start grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6";

interface ProductListModuleProps {
  entity: ResolvedEntity;
}

const STYLES = {
  scrollToTop: cn(
    "flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors",
  ),
};

// No pagination/infinite-scroll anymore — renders the full matching catalog
// for the category/brand/group in one shot.
const LIST_LIMIT = 1000;

async function getCachedListModuleData(entity: ResolvedEntity) {
  if (!entity) {
    throw new Error("Entity is required");
  }

  let categoryIds: string[] | undefined;
  let brandIds: string[] | undefined;
  let breadcrumbParent: { label: string; href: string } | null = null;

  const allCategories = await getCategoriesAction().then(unwrapActionResult);

  if (entity.type === "brand") {
    brandIds = [entity.data.id];
  } else if (entity.type === "category") {
    categoryIds = [entity.data.id];
    if (entity.data.group) {
      breadcrumbParent = {
        label: entity.data.group.name,
        href: `/san-pham/${entity.data.group.slug}`,
      };
    }
  } else if (entity.type === "group") {
    categoryIds = allCategories
      .filter((c) => c.groupId === entity.data.id && !c.isHidden)
      .map((c) => c.id);
  }

  const { data: products, totalCount } = await getProductsAction({
    categoryIds,
    brandIds,
    status: PRODUCT_STATUS.PUBLISHED,
    limit: LIST_LIMIT,
  });

  return {
    products,
    totalCount,
    breadcrumbParent,
    currentYear: new Date().getFullYear(),
  };
}

export async function ProductListModule({
  entity,
}: ProductListModuleProps) {
  if (!entity || entity.type === "product") return notFound();

  let pageTitle = "";
  let subTitlePrefix = "";

  if (entity.type === "brand") {
    pageTitle = entity.data.name;
    subTitlePrefix = "thương hiệu";
  } else if (entity.type === "category") {
    pageTitle = entity.data.name;
    subTitlePrefix = "danh mục";
  } else if (entity.type === "group") {
    pageTitle = entity.data.name;
    subTitlePrefix = "nhóm danh mục";
  }

  const displayTitle = pageTitle;
  // subTitlePrefix kept for potential future empty state use
  void subTitlePrefix;

  const { products, totalCount, breadcrumbParent, currentYear } =
    await getCachedListModuleData(entity);

  return (
    <main className="w-full bg-background min-h-screen public-catalog-page">
      <div className="w-full flex flex-col gap-6 p-4 md:p-6 lg:p-8">
        <Breadcrumbs
          items={[
            { label: "Sản phẩm", href: "/san-pham" },
            ...(breadcrumbParent ? [breadcrumbParent] : []),
            { label: pageTitle, active: true },
          ]}
        />

        {/* Recently Viewed Products */}
        <RecentlyViewedSection />

        {/* Header Title and Count */}
        <div className="flex flex-col gap-1.5 pb-4 border-b border-border/40">
          <TypographyH1>{displayTitle}</TypographyH1>
          <p className="text-sm text-muted-foreground">
            {`Danh sách ${totalCount} sản phẩm`}
          </p>
        </div>

        {products.length > 0 ? (
          <div className={GRID_CLASS}>
            {products.map((product, i) => (
              <ProductCard key={product.id} product={product} priority={i < 8} />
            ))}
          </div>
        ) : (
          <div className="py-24 text-center min-h-75 w-full">
            <p className="text-muted-foreground/60 italic text-sm">
              Không tìm thấy sản phẩm nào.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <GridSection contentClassName="py-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-muted-foreground">
          <TypographySmall>&copy; {currentYear} Điện máy ELC.</TypographySmall>
          <ScrollToTop className={STYLES.scrollToTop}>
            <TypographySmall>Quay lại đầu trang</TypographySmall>
          </ScrollToTop>
        </div>
      </GridSection>

      {/* JSON-LD: CollectionPage + ItemList (mainEntity) + BreadcrumbList — a
          listing page is a collection of products, never tagged as if it
          were itself a single Product/AggregateOffer. */}
      {(() => {
        const pageUrl = `${BASE_URL}/san-pham/${entity.data.slug}`;
        const breadcrumbTrail = [
          { name: "Trang chủ", url: BASE_URL },
          ...(breadcrumbParent ? [{ name: breadcrumbParent.label, url: `${BASE_URL}${breadcrumbParent.href}` }] : []),
          { name: pageTitle, url: pageUrl },
        ];

        const collectionPageSchema = {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: pageTitle,
          url: pageUrl,
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: totalCount,
            itemListElement: products.map((p, idx) => ({
              "@type": "ListItem",
              position: idx + 1,
              url: `${BASE_URL}/san-pham/${p.slug}`,
              name: p.name,
            })),
          },
        };

        const breadcrumbSchema = {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: breadcrumbTrail.map((item, idx) => ({
            "@type": "ListItem",
            position: idx + 1,
            name: item.name,
            item: item.url,
          })),
        };

        return (
          <>
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionPageSchema) }}
            />
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
            />
          </>
        );
      })()}
    </main>
  );
}
