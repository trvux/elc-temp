import type { Metadata } from "next";
import { getProductsAction } from "@/modules/catalog/presentation/actions";
import { PRODUCT_STATUS } from "@/modules/catalog/domain";
import { ProductCard } from "@/modules/catalog/presentation/components/ProductCard";
import { getCategoriesAction } from "@/modules/category/presentation/actions";
import { getGroupsAction } from "@/modules/group/presentation/actions";
import { getNewsAction, getNewsBySlugAction } from "@/modules/news/presentation/actions";
import { Breadcrumbs } from "@/shared/components/organisms/layout/user/breadcrumbs";
import { DetailPager } from "@/shared/components/organisms/layout/user/detail-pager";
import { PreviewContent } from "@/shared/components/organisms/layout/user/preview-content";
import { ScrollToTop } from "@/shared/components/organisms/layout/user/scroll-to-top";
import Image from "next/image";
import { primaryImageUrl } from "@/shared/lib/image-asset";
import {
  TypographyH1,
  TypographyH2,
  TypographySmall,
} from "@/shared/components/ui/typography";
import {
  matchLinksByName,
  type NamedLink,
} from "@/shared/lib/content-relevance";
import { unwrapActionResult } from "@/shared/lib/action-result";
import { getExcerptFromContent } from "@/shared/lib/rich-text";
import { BASE_URL } from "@/shared/lib/seo-schema";
import { ArrowLeft, ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cn } from "@/shared/lib/utils";

// Design System / Style Constants
const STYLES = {
  main: "w-full bg-background min-h-screen",
  // The old GridSection component (dashed-line + diamond dividers between
  // sections) was removed entirely (2026-09-24) — sections are now
  // separated by plain spacing only. Every section below is a plain div
  // pair sharing this container class, plus its own py-* override.
  sectionContainer:
    "mx-auto h-full w-full max-w-350 min-[112.5rem]:max-w-384 px-4 md:px-6 lg:px-12 relative",
  title: "w-full max-w-none! text-balance! font-heading leading-tight",
  footer:
    "w-full flex flex-col md:flex-row justify-between items-center gap-6 text-muted-foreground",
};

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Lighter than getCachedNewsDetailData below (which also fetches related
// news/products) — generateMetadata only needs the news item itself.
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const newsItem = await getNewsBySlugAction(slug).then(unwrapActionResult);
  if (!newsItem || !newsItem.isPublished) return {};

  const title = newsItem.metaTitle || `${newsItem.title} | Điện máy ELC`;
  const description =
    newsItem.metaDescription || getExcerptFromContent(newsItem.content, undefined);
  const image = primaryImageUrl(newsItem.images);
  const pageUrl = `${BASE_URL}/tin-tuc/${slug}`;

  return {
    title,
    description,
    alternates: { canonical: pageUrl },
    openGraph: {
      type: "article",
      title,
      description,
      url: pageUrl,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

async function getCachedNewsDetailData(slug: string) {
  const allNews = await getNewsAction({ isPublished: true }).then(unwrapActionResult);
  const newsItemIndex = (allNews ?? []).findIndex((n) => n.slug === slug);

  if (newsItemIndex === -1) {
    const newsItem = await getNewsBySlugAction(slug).then(unwrapActionResult);
    return {
      newsItem,
      prevNews: null,
      nextNews: null,
      relatedNews: [],
      relatedProducts: [],
      relatedProductsEntity: null,
      relatedProductsTotal: 0,
      currentYear: new Date().getFullYear(),
    };
  }

  const newsItem = allNews[newsItemIndex];
  const prevNews = newsItemIndex > 0 ? allNews[newsItemIndex - 1] : null;
  const nextNews =
    newsItemIndex < allNews.length - 1 ? allNews[newsItemIndex + 1] : null;

  // Lấy tin tức liên quan theo category_id (nếu có), loại trừ bài hiện tại.
  // Bổ sung các bài viết khác nếu không đủ 3 bài.
  const sameCategoryNews = newsItem.categoryId
    ? allNews.filter(
        (n) => n.categoryId === newsItem.categoryId && n.slug !== slug,
      )
    : [];
  const fallbackNews = allNews.filter(
    (n) => n.slug !== slug && n.categoryId !== newsItem.categoryId,
  );
  const relatedNews = [...sameCategoryNews, ...fallbackNews].slice(0, 3);

  // "Sản phẩm liên quan": ưu tiên category_id nếu admin đã gán trực tiếp (chính
  // xác tuyệt đối); nếu chưa gán (hiện tại 0/94 bài có category_id — chưa ai gắn
  // tay), rơi về khớp theo tên category/group xuất hiện nguyên văn trong tiêu đề.
  // Lấy MỘT category/group khớp tốt nhất rồi hiển thị đầy đủ sản phẩm của nó
  // (không chặn ở vài sản phẩm) — nếu nhiều hơn ngưỡng preview thì kèm link
  // "Xem tất cả" sang trang category/group đó, giống hệt cách trang chủ đã làm.
  const RELATED_PRODUCTS_PREVIEW = 15;

  const [allCategories, groupsRes] = await Promise.all([
    getCategoriesAction().then(unwrapActionResult),
    getGroupsAction(),
  ]);
  const allGroups = groupsRes.data || [];
  type EntityCandidate = NamedLink & { id: string; type: "category" | "group" };
  const entityCandidates: EntityCandidate[] = [
    ...allCategories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      type: "category" as const,
    })),
    ...allGroups.map((g) => ({
      id: g.id,
      name: g.name,
      slug: g.slug,
      type: "group" as const,
    })),
  ];
  const matchedEntity = newsItem.categoryId
    ? entityCandidates.find(
        (c) => c.type === "category" && c.id === newsItem.categoryId,
      )
    : matchLinksByName(newsItem.title, entityCandidates, 1)[0];

  let relatedProducts: Awaited<ReturnType<typeof getProductsAction>>["data"] =
    [];
  let relatedProductsEntity: EntityCandidate | null = null;
  let relatedProductsTotal = 0;

  if (matchedEntity) {
    const categoryIds =
      matchedEntity.type === "category"
        ? [matchedEntity.id]
        : allCategories
            .filter(
              (c) =>
                c.groupId === matchedEntity.id &&
                !c.isHidden,
            )
            .map((c) => c.id);

    if (categoryIds.length > 0) {
      const { data: products, totalCount } = await getProductsAction({
        categoryIds,
        status: PRODUCT_STATUS.PUBLISHED,
        limit: RELATED_PRODUCTS_PREVIEW,
        offset: 0,
      });
      relatedProducts = products;
      relatedProductsTotal = totalCount;
      relatedProductsEntity = matchedEntity;
    }
  }

  const currentYear = new Date().getFullYear();

  return {
    newsItem,
    prevNews,
    nextNews,
    relatedNews,
    relatedProducts,
    relatedProductsEntity,
    relatedProductsTotal,
    currentYear,
  };
}

export default async function NewsDetailPage({ params }: PageProps) {
  const { slug } = await params;

  // Fetch current news detail using the cached helper
  const {
    newsItem,
    prevNews,
    nextNews,
    relatedNews,
    relatedProducts,
    relatedProductsEntity,
    relatedProductsTotal,
    currentYear,
  } = await getCachedNewsDetailData(slug);

  if (!newsItem || !newsItem.isPublished) {
    notFound();
  }

  const title = newsItem.title || "Tin tức";
  const createdAt = newsItem.createdAt || "";

  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleDateString("vi-VN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  return (
    <main className={STYLES.main}>
      {/* Khối 1: Chi tiết bài viết */}
      <div id="news-detail-content" className="w-full relative">
        <div className={cn(STYLES.sectionContainer, "py-10 md:py-16")}>
        {/* Body copy stays at max-w-2xl (672px, closest Tailwind step to
            Linear's measured 624px blog column) for readability, but the
            header block (back link/date/title) and article are allowed to
            widen fluidly — matching Linear's own h1, which is NOT stepped:
            width = min(900px, 100% - 3rem) at every viewport from 500px to
            1920px (dense sweep, ~20 widths), never jumping the way a
            sm:/md:/lg: breakpoint would (a first attempt using stepped
            md:/lg: classes visibly mismatched Linear at in-between
            widths). A single max-w-[Nrem] (no breakpoint variants)
            reproduces that fluid-then-capped curve here, since this
            wrapper already sits inside sectionContainer's own padding, so
            "100%" is already viewport-relative.

            The cap is 56.25rem (900px) — Linear's own exact number.
            Font metrics were the real blocker for a while: Google Fonts'
            "Inter" rendered this test string at 907px unwrapped (weight
            600), 9% over the cap. Self-hosting the true "Inter Variable"
            (fontsource, matching Linear's own font-family + exact 590
            weight — see shared/components/ui/typography.tsx and
            app/layout.tsx, 2026-09-25) brought that down to 892px, under
            the 900px cap. A small residual gap remains (892 vs Linear's
            own 834.7 for the identical string) — fontsource's "Inter
            Variable" build isn't byte-identical to whatever exact version
            Linear serves, so a ~50px-wide viewport band (900-949px) still
            wraps one line later than Linear's — the practical limit short
            of extracting Linear's exact served font file. Body text's
            max-w-2xl doesn't need this — Linear's paragraph column is a
            flat 624px, no fluid range below that cap. */}
        <div className="max-w-[56.25rem] mx-auto w-full flex flex-col gap-6 animate-fade-in-up">
          <div>
            <Link
              href="/tin-tuc"
              className="group inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4"
            >
              <ArrowLeft className="w-3 h-3 transition-transform group-hover:-translate-x-0.5" />
              <span>Quay lại danh sách tin tức</span>
            </Link>
            {formattedDate && (
              <TypographySmall className="text-muted-foreground/60 mb-2 block font-medium font-sans">
                {formattedDate}
              </TypographySmall>
            )}
            <TypographyH1
              className={cn(
                STYLES.title,
                newsItem.titleAlign === "center" && "text-center",
                newsItem.titleAlign === "right" && "text-right",
              )}
            >
              {title}
            </TypographyH1>
          </div>
          <article className="max-w-2xl mx-auto w-full">
            <PreviewContent
              content={newsItem.content}
              fallbackAlt={title}
            />
          </article>
        </div>
        </div>
      </div>

      {/* Khối 2b: Sản phẩm liên quan */}
      {relatedProducts.length > 0 && (
        <div id="news-related-products" className="w-full relative">
          <div className={cn(STYLES.sectionContainer, "py-10 md:py-16")}>
          <div className="max-w-4xl mx-auto w-full">
            <div className="flex items-center justify-between gap-4 mb-6">
              <TypographyH2 className="text-xl md:text-2xl font-bold tracking-tight font-heading">
                Sản phẩm liên quan
              </TypographyH2>
              {relatedProductsEntity &&
                relatedProductsTotal > relatedProducts.length && (
                  <Link
                    href={`/san-pham/${relatedProductsEntity.slug}`}
                    prefetch={false}
                    className="group inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0"
                  >
                    Xem tất cả {relatedProductsTotal} sản phẩm
                    <ArrowRightIcon className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                )}
            </div>
            <div className="grid gap-x-4 gap-y-6 grid-cols-[repeat(auto-fill,minmax(160px,1fr))]">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
          </div>
        </div>
      )}

      {/* Khối 3: Bài viết liên quan */}
      {relatedNews.length > 0 && (
        <div id="news-related" className="w-full relative">
          <div className={cn(STYLES.sectionContainer, "py-10 md:py-16")}>
          <div className="max-w-3xl mx-auto w-full">
            <h3 className="text-xl md:text-2xl font-bold tracking-tight text-foreground mb-8 font-heading text-center md:text-left">
              Bài viết liên quan
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {relatedNews.map((item) => {
                const itemDate = item.createdAt
                  ? new Date(item.createdAt).toLocaleDateString("vi-VN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : "";

                return (
                  <Link
                    key={item.id}
                    href={`/tin-tuc/${item.slug}`}
                    className="group flex flex-col gap-3 no-underline"
                  >
                    {primaryImageUrl(item.images) && (
                      <div className="relative w-full aspect-video rounded-lg overflow-hidden border bg-muted">
                        <Image
                          src={primaryImageUrl(item.images)!}
                          alt={item.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 640px) 100vw, 250px"
                        />
                      </div>
                    )}
                    <div className="flex flex-col gap-1.5">
                      {itemDate && (
                        <span className="text-xs text-muted-foreground/60 font-medium font-sans">
                          {itemDate}
                        </span>
                      )}
                      <h4 className="font-heading text-sm font-semibold tracking-tight text-foreground group-hover:text-foreground/70 transition-colors line-clamp-2 leading-snug">
                        {item.title}
                      </h4>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
          </div>
        </div>
      )}

      {/* Khối 4: Điều hướng Pager (Trước / Sau) */}
      <div id="news-detail-nav" className="w-full relative">
        <div className={cn(STYLES.sectionContainer, "py-8")}>
        <DetailPager
          prev={
            prevNews
              ? { title: prevNews.title, href: `/tin-tuc/${prevNews.slug}` }
              : null
          }
          next={
            nextNews
              ? { title: nextNews.title, href: `/tin-tuc/${nextNews.slug}` }
              : null
          }
          prevLabel="Bài viết trước"
          nextLabel="Bài viết sau"
        />
        </div>
      </div>

      {/* Khối 5: Footer bản quyền */}
      <div id="news-detail-footer" className="w-full relative">
        <div className={cn(STYLES.sectionContainer, "py-6 md:py-8 lg:py-10")}>
        <footer className={STYLES.footer}>
          <TypographySmall>&copy; {currentYear} Điện máy ELC.</TypographySmall>
          <ScrollToTop className="flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors">
            <TypographySmall>Quay lại đầu trang</TypographySmall>
          </ScrollToTop>
        </footer>
        </div>
      </div>

      {/* Khối 6: Breadcrumbs */}
      <div id="news-detail-breadcrumbs" className="w-full relative">
        <div className={cn(STYLES.sectionContainer, "py-1")}>
        <div className="w-full">
          <Breadcrumbs
            items={[
              { label: "Tin tức", href: "/tin-tuc" },
              { label: title, active: true },
            ]}
          />
        </div>
        </div>
      </div>
    </main>
  );
}
