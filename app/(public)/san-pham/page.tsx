import type { Metadata } from "next";
import { getCatalogPageAction, getProductsAction } from "@/modules/catalog/presentation/actions";
import { PRODUCT_STATUS } from "@/modules/catalog/domain";
import { getCategoriesAction } from "@/modules/category/presentation/actions";
import {
  CategorySectionsGrid,
  type CategorySectionData,
} from "@/shared/components/layout/user/category-sections-grid";
import { CompareLinkButton } from "@/shared/components/layout/user/compare-link-button";
import { ProductDescription } from "@/shared/components/layout/user/product-description";
import { WishlistDialogButton } from "@/shared/components/layout/user/wishlist-dialog-button";
import { ScrollToTop } from "@/shared/components/layout/user/scroll-to-top";
import { RecentlyViewedSection } from "@/shared/components/layout/user/recently-viewed-section";
import { unwrapActionResult } from "@/shared/lib/action-result";
import { cn } from "@/shared/lib/utils";
import {
  TypographyH1,
  TypographySmall,
} from "@/shared/components/ui/typography";

export async function generateMetadata(): Promise<Metadata> {
  const { data: catalogPage } = await getCatalogPageAction();
  if (!catalogPage?.metaTitle && !catalogPage?.metaDescription) return {};
  return {
    title: catalogPage.metaTitle || undefined,
    description: catalogPage.metaDescription || undefined,
  };
}

const STYLES = {
  main: cn("w-full bg-background min-h-screen flex flex-col"),
  footer: cn(
    "w-full flex flex-col md:flex-row justify-between items-center gap-6 text-muted-foreground",
  ),
  scrollToTop: cn(
    "flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors",
  ),
};

async function getCachedCategories() {
  return getCategoriesAction().then(unwrapActionResult);
}

// This hub page only needs to show a *preview* per category — the category's own
// `/san-pham/{slug}` page is the authoritative, fully crawlable listing. Keeping
// this bounded (rather than growing with the catalog) is what makes it scale;
// the "Xem tất cả" link on each section is the crawl path into the rest.
const INITIAL_PER_SECTION = 24;

async function getCachedCategorySections(): Promise<CategorySectionData[]> {
  const allCategories = await getCachedCategories();

  // Build sort order: group.orderIndex * 1000 + category.orderIndex
  const catOrder = new Map<string, number>();
  allCategories.forEach((cat, i) => {
    const groupOrder =
      (cat as { group?: { orderIndex?: number } }).group?.orderIndex ?? 999;
    catOrder.set(cat.id, groupOrder * 1000 + (cat.orderIndex ?? i));
  });

  const sections = await Promise.all(
    allCategories.map(async (cat) => {
      const { data: products, totalCount, error } = await getProductsAction({
        categoryId: cat.id,
        status: PRODUCT_STATUS.PUBLISHED,
        limit: INITIAL_PER_SECTION,
        offset: 0,
      });
      if (error) throw new Error(error);
      return {
        categoryId: cat.id,
        categoryName: cat.name,
        categorySlug: cat.slug,
        initialProducts: products,
        totalCount,
      };
    }),
  );

  return sections
    .filter((s) => s.totalCount > 0)
    .sort(
      (a, b) =>
        (catOrder.get(a.categoryId) ?? 999999) -
        (catOrder.get(b.categoryId) ?? 999999),
    );
}

export default async function ProductsPage() {
  const [sections, { data: catalogPage }] = await Promise.all([
    getCachedCategorySections(),
    getCatalogPageAction(),
  ]);

  return (
    <main className={STYLES.main}>
      <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8 w-full max-w-400 mx-auto">
        {/* Recently Viewed Products */}
        <RecentlyViewedSection />

        <div className="flex items-start justify-between gap-4 pb-4 border-b border-border/40">
          <TypographyH1>Tất cả sản phẩm</TypographyH1>
          <div className="flex items-center gap-2 shrink-0">
            <WishlistDialogButton />
            <CompareLinkButton />
            {/* Nút "Lọc" (facet/filter) sẽ vào đây khi filter theo thuộc tính được xây */}
          </div>
        </div>

        <CategorySectionsGrid sections={sections} />

        {/* Sau lưới sản phẩm, không phải trước — người xem cần thấy sản
            phẩm trước tiên; nội dung này chỉ dành cho ai muốn tìm hiểu
            thêm, không nên chắn đường trước danh mục. */}
        {catalogPage?.content ? (
          <ProductDescription content={catalogPage.content} fallbackAlt="Tất cả sản phẩm" variant="hero" />
        ) : null}

        {/* Footer rights & Back to top */}
        <div className="w-full pt-8 border-t border-border/40 flex flex-col md:flex-row justify-between items-center gap-6 text-muted-foreground">
          <TypographySmall>
            &copy; {new Date().getFullYear()} Điện máy ELC.
          </TypographySmall>
          <ScrollToTop className={STYLES.scrollToTop}>
            <TypographySmall>Quay lại đầu trang</TypographySmall>
          </ScrollToTop>
        </div>
      </div>
    </main>
  );
}
