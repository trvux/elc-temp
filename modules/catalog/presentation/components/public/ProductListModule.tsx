import Image from "next/image";
import { notFound } from "next/navigation";

import { ShieldCheck } from "@phosphor-icons/react/dist/ssr";

import { getProductsAction } from "@/modules/catalog/presentation/actions";
import { PRODUCT_STATUS } from "@/modules/catalog/domain";
import { ProductGrid } from "@/modules/catalog/presentation/components/ProductGrid";
import { ResolvedEntity } from "@/modules/catalog/presentation/resolveProductPath";
import { getCategoriesAction } from "@/modules/category/presentation/actions";
import { Breadcrumbs } from "@/shared/components/layout/user/breadcrumbs";
import { CompareLinkButton } from "@/shared/components/layout/user/compare-link-button";
import { ProductDescription } from "@/shared/components/layout/user/product-description";
import { WishlistDialogButton } from "@/shared/components/layout/user/wishlist-dialog-button";
import { RecentlyViewedSection } from "@/shared/components/layout/user/recently-viewed-section";
import { ScrollToTop } from "@/shared/components/layout/user/scroll-to-top";
import { TypographyH1, TypographySmall } from "@/shared/components/ui/typography";
import { unwrapActionResult } from "@/shared/lib/action-result";
import { BASE_URL } from "@/shared/lib/seo-schema";

// No pagination/infinite-scroll — renders the full matching catalog for the
// category/brand/group in one shot (small catalog, largest single category
// ~59 products).
const LIST_LIMIT = 1000;

interface ProductListModuleProps {
  entity: ResolvedEntity;
}

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

  const pageTitle = entity.data.name;
  const heroImageUrl = entity.type === "brand" ? entity.data.logoUrl : entity.data.imageUrl;
  const heroContent = entity.data.content;
  const warrantyPolicy = entity.type === "brand" ? entity.data.warrantyPolicy : null;

  const { products, totalCount, breadcrumbParent, currentYear } =
    await getCachedListModuleData(entity);

  return (
    <main className="w-full bg-background min-h-screen public-catalog-page">
      <div className="w-full flex flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-350 mx-auto">
        <Breadcrumbs
          items={[
            { label: "Sản phẩm", href: "/san-pham" },
            ...(breadcrumbParent ? [breadcrumbParent] : []),
            { label: pageTitle, active: true },
          ]}
        />

        <div className="flex flex-col gap-4 pb-6 border-b border-dashed border-border/40">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              {heroImageUrl && (
                <div className="shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-white border border-border/50">
                  <Image
                    src={heroImageUrl}
                    alt={pageTitle}
                    width={64}
                    height={64}
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
              <div className="flex flex-col gap-1">
                <TypographyH1>{pageTitle}</TypographyH1>
                <TypographySmall className="text-muted-foreground">
                  {`${totalCount} sản phẩm`}
                </TypographySmall>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <WishlistDialogButton />
              {totalCount >= 2 && <CompareLinkButton />}
              {/* Nút "Lọc" (facet/filter) sẽ vào đây khi filter theo thuộc tính được xây */}
            </div>
          </div>

          {warrantyPolicy && (
            <div className="flex items-start gap-2.5 rounded-lg border border-border bg-card px-4 py-3 text-sm">
              <ShieldCheck className="shrink-0 translate-y-0.5" />
              <div className="flex flex-col gap-0.5">
                <span className="font-medium">Chính sách bảo hành</span>
                <span className="text-muted-foreground text-balance">{warrantyPolicy}</span>
              </div>
            </div>
          )}

          {heroContent ? <ProductDescription content={heroContent} fallbackAlt={pageTitle} /> : null}
        </div>

        <RecentlyViewedSection />

        {products.length > 0 ? (
          <ProductGrid products={products} />
        ) : (
          <div className="py-24 text-center min-h-75 w-full">
            <p className="text-muted-foreground/60 italic text-sm">
              Không tìm thấy sản phẩm nào.
            </p>
          </div>
        )}
      </div>

      <div className="w-full max-w-350 mx-auto px-4 md:px-6 lg:px-8 py-6 border-t border-dashed border-border/40">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-muted-foreground">
          <TypographySmall>&copy; {currentYear} Điện máy ELC.</TypographySmall>
          <ScrollToTop className="flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors">
            <TypographySmall>Quay lại đầu trang</TypographySmall>
          </ScrollToTop>
        </div>
      </div>

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
