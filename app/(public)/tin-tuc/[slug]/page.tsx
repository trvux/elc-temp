import { getProductsAction } from "@/modules/catalog/presentation/actions";
import { ProductCard } from "@/modules/catalog/presentation/components/ProductCard";
import { getCategoriesAction } from "@/modules/category/presentation/actions";
import { getGroupsAction } from "@/modules/group/presentation/actions";
import { getNewsAction, getNewsBySlugAction } from "@/modules/news/presentation/actions";
import { Breadcrumbs } from "@/shared/components/layout/user/breadcrumbs";
import { DetailPager } from "@/shared/components/layout/user/detail-pager";
import { PreviewContent } from "@/shared/components/layout/user/preview-content";
import { ScrollToTop } from "@/shared/components/layout/user/scroll-to-top";
import { GridSection } from "@/shared/components/sections/grid-section";
import { ImageWithSkeleton } from "@/shared/components/ui/image-with-skeleton";
import {
  TypographyH1,
  TypographyH2,
  TypographySmall,
} from "@/shared/components/ui/typography";
import {
  matchLinksByName,
  type NamedLink,
} from "@/shared/lib/content-relevance";
import {
  BASE_URL,
  generateBreadcrumbSchema,
  sanitizeAndFormatTitle,
} from "@/shared/lib/seo-utils";
import { unwrapActionResult } from "@/shared/lib/action-result";
import { setUseStaticClient } from "@/shared/lib/supabase/server";
import { ArrowLeft, ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import Link from "next/link";
import { notFound } from "next/navigation";

// Design System / Style Constants
const STYLES = {
  main: "w-full bg-background min-h-screen",
  title: "w-full max-w-none! text-wrap! font-heading leading-tight",
  footer:
    "w-full flex flex-col md:flex-row justify-between items-center gap-6 text-muted-foreground",
};

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

async function getCachedNewsDetailData(slug: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(
    "news-list",
    "categories",
    "products",
    "products-list",
    `news-slug:${slug}`,
  );
  setUseStaticClient(true);

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
                !c.name.toLowerCase().includes("chưa phân loại"),
            )
            .map((c) => c.id);

    if (categoryIds.length > 0) {
      const { data: products, totalCount } = await getProductsAction({
        categoryIds,
        isPublished: true,
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

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const { newsItem } = await getCachedNewsDetailData(slug);

  if (!newsItem) {
    return {
      title: "Không tìm thấy bài viết | ELC",
    };
  }

  const title = sanitizeAndFormatTitle(
    newsItem.metaTitle || newsItem.title,
    false,
  );
  const description = newsItem.metaDescription || newsItem.title;

  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/tin-tuc/${slug}`,
    },
    openGraph: {
      title,
      description,
      images: newsItem.image ? [newsItem.image] : [],
      type: "article",
    },
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

  const newsArticleSchema = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: newsItem.title,
    image: newsItem.image ? [newsItem.image] : [],
    datePublished: newsItem.createdAt,
    dateModified: newsItem.updatedAt || newsItem.createdAt,
    author: {
      "@type": "Organization",
      name: "Điện máy ELC",
      url: "https://dienmayelc.com.vn",
    },
    publisher: {
      "@type": "Organization",
      name: "Điện máy ELC",
      logo: {
        "@type": "ImageObject",
        url: "https://dienmayelc.com.vn/icon.svg",
      },
    },
    description: newsItem.metaDescription || newsItem.title,
  };

  const breadcrumbSchema = generateBreadcrumbSchema(
    [{ label: "Tin tức", href: "/tin-tuc" }, { label: title }],
    `${BASE_URL}/tin-tuc/${slug}`,
  );

  return (
    <main className={STYLES.main}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(newsArticleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {/* Khối 1: Chi tiết bài viết */}
      <GridSection
        id="news-detail-content"
        isFirst={true}
        showDiamond={true}
        contentClassName="py-10 md:py-16"
      >
        <div className="max-w-3xl mx-auto w-full flex flex-col gap-6 animate-fade-in-up">
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
            <TypographyH1 className={STYLES.title}>{title}</TypographyH1>
          </div>
          <article>
            <PreviewContent
              content={newsItem.content}
              hideFirstHeading={true}
              fallbackAlt={title}
            />
          </article>
        </div>
      </GridSection>

      {/* Khối 2b: Sản phẩm liên quan */}
      {relatedProducts.length > 0 && (
        <GridSection
          id="news-related-products"
          isFirst={false}
          showDiamond={true}
          contentClassName="py-10 md:py-16"
        >
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
        </GridSection>
      )}

      {/* Khối 3: Bài viết liên quan */}
      {relatedNews.length > 0 && (
        <GridSection
          id="news-related"
          isFirst={false}
          showDiamond={true}
          contentClassName="py-10 md:py-16"
        >
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
                    {item.image && (
                      <ImageWithSkeleton
                        wrapperClassName="relative w-full aspect-video rounded-lg overflow-hidden border bg-muted"
                        src={item.image}
                        alt={item.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, 250px"
                      />
                    )}
                    <div className="flex flex-col gap-1.5">
                      {itemDate && (
                        <span className="text-[10px] text-muted-foreground/60 font-medium font-sans">
                          {itemDate}
                        </span>
                      )}
                      <h4 className="text-sm font-semibold tracking-tight text-foreground group-hover:text-foreground/70 transition-colors line-clamp-2 leading-snug">
                        {item.title}
                      </h4>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </GridSection>
      )}

      {/* Khối 4: Điều hướng Pager (Trước / Sau) */}
      <GridSection
        id="news-detail-nav"
        isFirst={false}
        showDiamond={true}
        contentClassName="py-8"
      >
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
      </GridSection>

      {/* Khối 5: Footer bản quyền */}
      <GridSection
        id="news-detail-footer"
        isFirst={false}
        showDiamond={true}
        contentClassName="py-6 md:py-8 lg:py-10"
      >
        <footer className={STYLES.footer}>
          <TypographySmall>&copy; {currentYear} Điện máy ELC.</TypographySmall>
          <ScrollToTop className="flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors">
            <TypographySmall>Quay lại đầu trang</TypographySmall>
          </ScrollToTop>
        </footer>
      </GridSection>

      {/* Khối 6: Breadcrumbs */}
      <GridSection
        id="news-detail-breadcrumbs"
        isFirst={false}
        showDiamond={false}
        contentClassName="py-1"
      >
        <div className="w-full">
          <Breadcrumbs
            items={[
              { label: "Tin tức", href: "/tin-tuc" },
              { label: title, active: true },
            ]}
          />
        </div>
      </GridSection>
    </main>
  );
}
