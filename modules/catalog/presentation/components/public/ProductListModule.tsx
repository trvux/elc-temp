import { getProductsAction } from "@/modules/catalog/presentation/actions";
import { ResolvedEntity } from "@/modules/catalog/presentation/resolveProductPath";
import { ProductFilters } from "@/modules/catalog/presentation/components/ProductFilters";
import { getCategoriesAction } from "@/modules/category/presentation/actions";
import { Breadcrumbs } from "@/shared/components/layout/user/breadcrumbs";
import { FilteredGridWrapper } from "@/shared/components/layout/user/filtered-grid-wrapper";
import { RecentlyViewedSection } from "@/shared/components/layout/user/recently-viewed-section";
import { InfiniteProductGrid } from "@/shared/components/layout/user/infinite-product-grid";
import { ProductPagination } from "@/shared/components/layout/user/product-pagination";
import { PreviewContent } from "@/shared/components/layout/user/preview-content";
import { ScrollToTop } from "@/shared/components/layout/user/scroll-to-top";
import { buildPageHref } from "@/shared/lib/pagination";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/components/ui/accordion";
import {
  Sidebar,
  SidebarContent,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/shared/components/ui/sidebar";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  TypographyH1,
  TypographyH2,
  TypographySmall,
} from "@/shared/components/ui/typography";
import { getQueryTokens } from "@/shared/lib/search-utils";
import { unwrapActionResult } from "@/shared/lib/action-result";
import {
  BASE_URL,
  generateBreadcrumbSchema,
  generateCollectionSchema,
  localizeRichText,
} from "@/shared/lib/seo-utils";
import { setUseStaticClient } from "@/shared/lib/supabase/server";
import { cn } from "@/shared/lib/utils";
import { cacheLife, cacheTag } from "next/cache";
import { notFound } from "next/navigation";
import Link from "next/link";

import { GridSection } from "@/shared/components/sections/grid-section";
import { District } from "@/shared/lib/districts";
import { ImageWithSkeleton } from "@/shared/components/ui/image-with-skeleton";
import { matchNewsByEntityName } from "@/shared/lib/content-relevance";
import { getNewsAction } from "@/modules/news/presentation/actions";

interface ProductListModuleProps {
  entity: ResolvedEntity;
  searchParams: { [key: string]: string | string[] | undefined };
  location?: District;
}

const STYLES = {
  main: cn("w-full bg-background min-h-screen flex flex-col"),
  header: cn("flex flex-col items-center text-center gap-3 w-full"),
  title: cn("w-full max-w-none! text-wrap!"),
  skeletonGrid: cn(
    "grid gap-x-4 gap-y-6 md:gap-y-12 min-h-[450px] [grid-template-columns:repeat(auto-fill,minmax(160px,1fr))]",
  ),
  emptyState: cn("py-24 text-center min-h-[300px] w-full animate-fade-in-up"),
  emptyText: cn("text-muted-foreground/60 italic text-sm"),
  footer: cn(
    "w-full flex flex-col md:flex-row justify-between items-center gap-6 text-muted-foreground",
  ),
  scrollToTop: cn(
    "flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors",
  ),
};

// One real, crawlable page of products. Every page is server-rendered at its own
// `?page=N` URL via ProductPagination below — scales to any catalog size, unlike a
// raised SSR cap. InfiniteProductGrid layers scroll-to-load on top for JS users.
const PAGE_SIZE = 30;

async function getCachedListModuleData(
  entity: ResolvedEntity,
  q: string,
  minPrice: number | undefined,
  maxPrice: number | undefined,
  brandSlugs: string[],
  specs: Record<string, string[]>,
  condition: string | undefined,
  offset: number,
) {
  "use cache";
  cacheLife("days");
  cacheTag("products");
  setUseStaticClient(true);

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
      .filter((c) => c.groupId === entity.data.id && !c.name.toLowerCase().includes("chưa phân loại"))
      .map((c) => c.id);
  }

  const { data: products, totalCount, facets: availableFilters } = await getProductsAction({
    categoryIds,
    brandIds,
    brandSlugs,
    isPublished: true,
    search: q,
    minPrice,
    maxPrice,
    specs,
    condition,
    limit: PAGE_SIZE,
    offset,
  });

  return {
    products,
    totalCount,
    availableFilters,
    allCategories,
    breadcrumbParent,
    currentYear: new Date().getFullYear(),
  };
}

// "Bài viết liên quan" — cheap reverse of the same name-substring match used on the
// news article page (shared/lib/content-relevance.ts). Only meaningful for
// category/group entities: brand and district-location names essentially never
// appear verbatim in article titles, so we don't bother fetching for those.
async function getCachedRelatedNews(entityName: string) {
  "use cache";
  cacheLife("hours");
  cacheTag("news-list");
  setUseStaticClient(true);

  const allNews = await getNewsAction({ isPublished: true }).then(unwrapActionResult);
  return matchNewsByEntityName(entityName, allNews ?? [], 3);
}

function getFallbackContent(entity: ResolvedEntity, location?: District) {
  if (!entity || entity.type === "product") return null;

  const name = entity.data.name;
  const locSuffix = location ? ` tại ${location.name}` : "";
  const locInText = location ? ` tại khu vực ${location.name}` : "";
  let title = name;
  let p1 = "";
  let p2 = "";

  if (entity.type === "category") {
    title = `Tìm hiểu về ${name} chính hãng${locSuffix}`;
    p1 = `${name} chính hãng${locSuffix} là giải pháp điều hòa không khí hiện đại, được thiết kế tối ưu để mang lại bầu không khí trong lành, mát mẻ cho mọi không gian sống và làm việc${locInText}. Với các tính năng vượt trội như công nghệ tiết kiệm điện năng Inverter, màng lọc kháng khuẩn khử mùi tiên tiến và cơ chế vận hành êm ái, dòng sản phẩm này đang là sự lựa chọn hàng đầu của người tiêu dùng. Điện máy ELC tự hào phân phối các dòng máy chính hãng từ các thương hiệu lớn với chính sách hỗ trợ kỹ thuật và bảo hành chuyên nghiệp.`;
    p2 = `Khi chọn mua ${name.toLowerCase()}${locSuffix}, quý khách hàng cần lưu ý các yếu tố quan trọng như công suất máy (HP) phù hợp với diện tích phòng, khả năng tiết kiệm năng lượng, các tiện ích thông minh đi kèm và thương hiệu uy tín. Đội ngũ tư vấn giàu kinh nghiệm tại Điện máy ELC luôn sẵn sàng hỗ trợ quý khách khảo sát địa hình thực tế${locInText} và tư vấn giải pháp lắp đặt tối ưu nhất, đảm bảo tính thẩm mỹ, độ bền cao và hiệu suất hoạt động lâu dài cho toàn bộ hệ thống.`;
  } else if (entity.type === "brand") {
    title = `Tìm hiểu về thương hiệu ${name}${locSuffix}`;
    p1 = `Thương hiệu ${name} từ lâu đã khẳng định được vị thế hàng đầu trong ngành công nghiệp điện lạnh nhờ vào chất lượng sản phẩm vượt trội, độ bền cao và công nghệ tiên tiến. Các dòng sản phẩm đến từ hãng luôn đi đầu trong việc tích hợp các giải pháp thông minh, bảo vệ sức khỏe người dùng và thân thiện với môi trường. Điện máy ELC tự hào là đối tác phân phối chính thức các sản phẩm của thương hiệu này${locInText}, mang đến cho người tiêu dùng những giải pháp làm mát tối ưu và đáng tin cậy nhất.`;
    p2 = `Quý khách hàng khi mua sắm các thiết bị của thương hiệu ${name}${locSuffix} tại Điện máy ELC sẽ được hưởng trọn vẹn chính sách bảo hành chính hãng, dịch vụ lắp đặt chuyên nghiệp và chế độ hậu mãi chu đáo. Chúng tôi cam kết cung cấp sản phẩm với mức giá cạnh tranh nhất trên thị trường, đi kèm dịch vụ khảo sát và tư vấn kỹ thuật tận nơi${locInText} từ đội ngũ chuyên viên giàu kinh nghiệm, giúp tối ưu hóa hiệu quả sử dụng và tiết kiệm tối đa chi phí cho gia đình bạn.`;
  } else if (entity.type === "group") {
    title = `Giới thiệu giải pháp ${name}${locSuffix}`;
    p1 = `Danh mục ${name}${locSuffix} tại Điện máy ELC tập hợp đa dạng các dòng sản phẩm làm mát từ phân khúc dân dụng đến thương mại, phục vụ mọi nhu cầu sử dụng của hộ gia đình, văn phòng và các dự án công trình quy mô lớn${locInText}. Chúng tôi luôn cập nhật những dòng máy mới nhất tích hợp công nghệ làm lạnh nhanh, công nghệ biến tần tiết kiệm điện năng và hệ thống lọc khí hiện đại giúp bảo vệ sức khỏe tối đa cho các member trong gia đình.`;
    p2 = `Để sở hữu hệ thống ${name.toLowerCase()}${locSuffix} hoạt động hiệu quả và bền bỉ, việc khảo sát thiết kế và lắp đặt đúng tiêu chuẩn kỹ thuật đóng vai trò cực kỳ quan trọng. Đến với Điện máy ELC, quý khách hàng không chỉ nhận được sản phẩm chính hãng 100% với giá tốt nhất mà còn được trải nghiệm dịch vụ thi công trọn gói chuyên nghiệp${locInText}, chuyên sâu từ khâu đi đường ống đến vận hành chạy thử hệ thống, cam kết mang lại sự hài lòng tuyệt đối.`;
  }

  return {
    type: "doc",
    content: [
      {
        type: "heading",
        attrs: { level: 2 },
        content: [
          {
            type: "text",
            text: title,
          },
        ],
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: p1,
          },
        ],
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: p2,
          },
        ],
      },
    ],
  };
}

function getFallbackFaq(
  entity: ResolvedEntity,
  location?: District,
): Array<{ question: string; answer: string }> {
  if (!entity || entity.type === "product") return [];

  const name = entity.data.name;
  const locName = location?.name || "TPHCM";

  if (entity.type === "category") {
    return [
      {
        question: `Có nên chọn mua ${name} chính hãng tại Điện máy ELC khu vực ${locName} không?`,
        answer: `Có, Điện máy ELC cam kết phân phối sản phẩm chính hãng 100% kèm đầy đủ giấy tờ chứng nhận nguồn gốc xuất xứ, dịch vụ tư vấn kỹ thuật chuyên sâu và chính sách lắp đặt bảo hành uy tín nhất tại ${locName}.`,
      },
      {
        question: `Sản phẩm ${name} có được hỗ trợ lắp đặt tận nơi tại ${locName} hay không?`,
        answer: `Điện máy ELC cung cấp dịch vụ giao hàng và thi công lắp đặt trọn gói chuyên nghiệp tại ${locName} bởi đội ngũ kỹ thuật viên giàu kinh nghiệm, tuân thủ nghiêm ngặt quy trình kỹ thuật để đảm bảo máy vận hành tốt nhất.`,
      },
      {
        question: `Chính sách bảo hành dành cho ${name} tại Điện máy ELC như thế nào?`,
        answer: `Tất cả sản phẩm đều được áp dụng chính sách bảo hành chính hãng theo đúng quy định của nhà sản xuất. Đồng thời, Điện máy ELC hỗ trợ kỹ thuật nhanh chóng tại ${locName} khi khách hàng gặp sự cố trong quá trình sử dụng.`,
      },
    ];
  } else if (entity.type === "brand") {
    return [
      {
        question: `Sản phẩm của thương hiệu ${name} tại ${locName} dùng có tốt và bền không?`,
        answer: `Các thiết bị của hãng nổi tiếng với độ bền vượt trội, khả năng tiết kiệm điện năng xuất sắc và tích hợp nhiều công nghệ tiên tiến nhất, mang đến hiệu suất làm mát ổn định qua nhiều năm sử dụng tại khu vực ${locName}.`,
      },
      {
        question: `Điện máy ELC có phải là đại lý phân phối chính thức của ${name} tại ${locName} không?`,
        answer: `Đúng vậy, Điện máy ELC là đối tác phân phối chính thức của thương hiệu này tại ${locName}, cam kết cung cấp sản phẩm chính hãng chất lượng cao cùng mức giá cực kỳ ưu đãi.`,
      },
      {
        question: `Khi mua sản phẩm ${name} thì việc bảo hành tại ${locName} sẽ được thực hiện ở đâu?`,
        answer: `Sản phẩm sẽ được bảo hành trực tiếp tại các trung tâm bảo hành ủy quyền của hãng trên toàn quốc. Điện máy ELC cũng hỗ trợ tiếp nhận thông tin và phối hợp xử lý bảo hành nhanh nhất cho khách hàng tại ${locName}.`,
      },
    ];
  } else if (entity.type === "group") {
    return [
      {
        question: `Làm sao để lựa chọn dòng ${name} phù hợp nhất với nhu cầu sử dụng tại ${locName}?`,
        answer: `Quý khách nên xác định diện tích không gian cần làm mát để lựa chọn công suất máy phù hợp, đồng thời cân nhắc các yếu tố như tính năng tiết kiệm điện Inverter, kiểu dáng thiết kế và ngân sách đầu tư tại ${locName}.`,
      },
      {
        question: `Điện máy ELC có cung cấp đầy đủ các thương hiệu ${name} lớn tại ${locName} không?`,
        answer: `Chúng tôi cung cấp đa dạng sản phẩm từ các hãng hàng đầu hiện nay như Daikin, Panasonic, LG, Casper, Mitsubishi và nhiều thương hiệu uy tín khác tại ${locName}, đáp ứng tối đa mọi yêu cầu từ phía khách hàng.`,
      },
      {
        question: `Giá bán của các dòng ${name} tại Điện máy ELC đã bao gồm chi phí lắp đặt tại ${locName} chưa?`,
        answer: `Giá hiển thị trên website là giá bán sản phẩm. Tùy thuộc vào vị trí và độ khó khi thi công thực tế, chi phí vật tư và nhân công lắp đặt tại ${locName} sẽ được Điện máy ELC báo giá chi tiết, minh bạch trước khi thực hiện.`,
      },
    ];
  }

  return [];
}

export async function ProductListModule({
  entity,
  searchParams,
  location,
}: ProductListModuleProps) {
  if (!entity || entity.type === "product") return notFound();

  const sParams = searchParams;
  const q =
    typeof sParams.search === "string"
      ? sParams.search.trim()
      : typeof sParams.q === "string"
        ? sParams.q.trim()
        : "";
  const minPrice =
    typeof sParams.minPrice === "string" && sParams.minPrice
      ? Number(sParams.minPrice)
      : undefined;
  const maxPrice =
    typeof sParams.maxPrice === "string" && sParams.maxPrice
      ? Number(sParams.maxPrice)
      : undefined;
  const currentPage = Math.max(1, Math.floor(Number(sParams.page)) || 1);
  const offset = (currentPage - 1) * PAGE_SIZE;
  const brandSlugs = Array.isArray(sParams.brands)
    ? sParams.brands
    : typeof sParams.brands === "string"
      ? [sParams.brands]
      : [];
  const specs: Record<string, string[]> = {};
  Object.keys(sParams).forEach((key) => {
    if (key.startsWith("spec_")) {
      const label = key.replace("spec_", "");
      const val = sParams[key];
      specs[label] = Array.isArray(val)
        ? val
        : typeof val === "string"
          ? [val]
          : [];
    }
  });

  const condition =
    typeof sParams.condition === "string" && sParams.condition
      ? sParams.condition
      : undefined;

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

  const {
    products,
    totalCount,
    availableFilters,
    allCategories,
    breadcrumbParent,
    currentYear,
  } = await getCachedListModuleData(
    entity,
    q,
    minPrice,
    maxPrice,
    brandSlugs,
    specs,
    condition,
    offset,
  );

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const queryTokens = getQueryTokens(q);

  const relatedNews =
    entity.type === "category" || entity.type === "group"
      ? await getCachedRelatedNews(entity.data.name)
      : [];

  // Build fetchParams for InfiniteProductGrid
  const fetchParams = {
    q: q || undefined,
    minPrice,
    maxPrice,
    brands: brandSlugs.length > 0 ? brandSlugs : undefined,
    condition,
    specs: Object.keys(specs).length > 0 ? specs : undefined,
    entityType: entity.type as "category" | "brand" | "group",
    entityId: entity.data.id,
  };

  const dbContent = entity.data.content;
  const typedContent = dbContent as
    | { type?: string; content?: unknown[] }
    | null
    | undefined;
  const hasDbContent = !!(
    typedContent &&
    typeof typedContent === "object" &&
    typedContent.type === "doc" &&
    Array.isArray(typedContent.content) &&
    typedContent.content.length > 0
  );
  const seoContent = localizeRichText(
    hasDbContent ? dbContent : getFallbackContent(entity, location),
    location,
  );

  const dbFaq = entity.data.faq;
  const hasDbFaq = !!(Array.isArray(dbFaq) && dbFaq.length > 0);
  let faqList: Array<{ question: string; answer: string }> =
    hasDbFaq && dbFaq
      ? (dbFaq as unknown as Array<{ question: string; answer: string }>)
      : getFallbackFaq(entity, location);

  if (location && faqList.length > 0) {
    faqList = faqList.map((item) => {
      const q = item.question;
      const a = item.answer;

      const replaceLocationTerms = (text: string): string => {
        return text
          .replace(
            /tất cả các quận huyện thuộc [^.!?]* và lân cận/gi,
            `khu vực ${location.name}`,
          )
          .replace(
            /toàn bộ các quận huyện thuộc [^.!?]* và lân cận/gi,
            `khu vực ${location.name}`,
          )
          .replace(/các quận huyện và lân cận/gi, `khu vực ${location.name}`)
          .replace(/Thành phố Hồ Chí Minh/gi, location.name)
          .replace(/TP\.HCM/gi, location.name)
          .replace(/TPHCM/gi, location.name)
          .replace(/Sài Gòn/gi, location.name);
      };

      let newQ = replaceLocationTerms(q);
      let newA = replaceLocationTerms(a);

      if (
        newQ === q &&
        !newQ.toLowerCase().includes(location.name.toLowerCase())
      ) {
        if (newQ.toLowerCase().includes("tại điện máy elc")) {
          newQ = newQ.replace(
            /tại Điện máy ELC/gi,
            `tại Điện máy ELC khu vực ${location.name}`,
          );
        } else if (newQ.toLowerCase().includes("chính hãng")) {
          newQ = newQ.replace(
            /chính hãng/gi,
            `chính hãng tại ${location.name}`,
          );
        } else if (newQ.toLowerCase().includes("giao hàng")) {
          newQ = newQ.replace(/giao hàng/gi, `giao hàng tại ${location.name}`);
        } else if (newQ.endsWith("?")) {
          newQ =
            newQ.substring(0, newQ.length - 1).trim() +
            ` tại ${location.name}?`;
        }
      }

      if (
        newA === a &&
        !newA.toLowerCase().includes(location.name.toLowerCase())
      ) {
        if (newA.toLowerCase().includes("tại điện máy elc")) {
          newA = newA.replace(
            /tại Điện máy ELC/gi,
            `tại Điện máy ELC khu vực ${location.name}`,
          );
        } else {
          newA = newA.trim();
          if (!newA.endsWith(".")) newA += ".";
          newA += ` Điện máy ELC hỗ trợ bàn giao và lắp đặt nhanh chóng tại khu vực ${location.name}.`;
        }
      }

      return { question: newQ, answer: newA };
    });
  }

  return (
    <main className="w-full bg-background min-h-screen public-catalog-page">
      <div className="w-full relative">
        <SidebarProvider
          defaultOpen={false}
          className="min-h-0 relative w-full flex items-start"
        >
          {/* Sidebar */}
          <Sidebar variant="inset" className="!absolute !h-full">
            <SidebarContent className="bg-sidebar p-5">
              <ProductFilters
                categories={allCategories}
                availableFilters={availableFilters}
              />
            </SidebarContent>
          </Sidebar>

          {/* Main content inset */}
          <SidebarInset className="min-w-0 flex-1 bg-background min-h-[calc(100vh-var(--header-height,64px)-16px)] md:m-2 md:ml-0 md:rounded-xl md:shadow-sm md:border md:border-border/40 overflow-hidden">
            {/* Sticky Header next to Sidebar Trigger */}
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-6">
              <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground" />
              <div className="h-4 w-px bg-border mx-2" />
              <div className="flex-1 min-w-0">
                <Breadcrumbs
                  items={[
                    { label: "Sản phẩm", href: "/san-pham" },
                    ...(breadcrumbParent ? [breadcrumbParent] : []),
                    { label: pageTitle, active: true },
                  ]}
                />
              </div>
            </header>

            {/* Page content container */}
            <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8 min-w-0 w-full">
              {/* Recently Viewed Products */}
              <RecentlyViewedSection />

              {/* Header Title and Count */}
              <div className="flex flex-col gap-1.5 pb-4 border-b border-border/40">
                <TypographyH1>{displayTitle}</TypographyH1>
                <p className="text-sm text-muted-foreground">
                  {location
                    ? `Giao hàng và lắp đặt chuyên nghiệp tại ${location.name}`
                    : `Danh sách ${totalCount} sản phẩm đáp ứng tiêu chí`}
                </p>
              </div>

              {/* Grid Wrapper */}
              <FilteredGridWrapper
                fallback={
                  <div className={STYLES.skeletonGrid}>
                    {Array.from({ length: 8 }).map((_, index) => (
                      <div key={index} className="flex flex-col gap-4">
                        <Skeleton className="aspect-video w-full rounded-2xl" />
                        <div className="space-y-2">
                          <Skeleton className="h-5 w-full" />
                          <Skeleton className="h-5 w-2/3" />
                        </div>
                        <Skeleton className="h-6 w-1/3" />
                      </div>
                    ))}
                  </div>
                }
              >
                <InfiniteProductGrid
                  initialProducts={products}
                  totalCount={totalCount}
                  fetchParams={fetchParams}
                  queryTokens={queryTokens}
                  initialOffset={offset}
                />
              </FilteredGridWrapper>

              <ProductPagination
                currentPage={currentPage}
                totalPages={totalPages}
                buildHref={(page) => buildPageHref(sParams, page)}
              />
            </div>
          </SidebarInset>
        </SidebarProvider>
      </div>

      {/* SEO Content Section */}
      {!!seoContent && (
        <GridSection>
          <PreviewContent
            content={seoContent}
            className="prose-sm md:prose-base text-foreground/80 leading-relaxed max-w-4xl"
            skipFirstHeadingPromotion={true}
            demoteHeadingOne={true}
            fallbackAlt={pageTitle}
          />
        </GridSection>
      )}

      {/* FAQ Section */}
      {faqList && faqList.length > 0 && (
        <GridSection>
          <div className="max-w-4xl space-y-6">
            <TypographyH2 className="text-xl md:text-2xl font-bold tracking-tight">
              Câu hỏi thường gặp (FAQ)
            </TypographyH2>
            <Accordion type="single" collapsible className="w-full">
              {faqList.map((item, index) => (
                <AccordionItem
                  key={index}
                  value={`faq-item-${index}`}
                  className="border-b"
                >
                  <AccordionTrigger className="text-sm md:text-base font-semibold text-foreground py-4 hover:no-underline hover:text-primary">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm md:text-base text-muted-foreground leading-relaxed pb-4">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </GridSection>
      )}

      {/* Bài viết liên quan */}
      {relatedNews.length > 0 && (
        <GridSection>
          <div className="max-w-4xl space-y-6">
            <TypographyH2 className="text-xl md:text-2xl font-bold tracking-tight">
              Bài viết liên quan
            </TypographyH2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {relatedNews.map((item) => (
                <Link
                  key={item.id}
                  href={`/tin-tuc/${item.slug}`}
                  prefetch={false}
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
                  <h4 className="text-sm font-semibold tracking-tight text-foreground group-hover:text-foreground/70 transition-colors line-clamp-2 leading-snug">
                    {item.title}
                  </h4>
                </Link>
              ))}
            </div>
          </div>
        </GridSection>
      )}

      {/* Footer */}
      <GridSection contentClassName="py-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-muted-foreground">
          <TypographySmall>&copy; {currentYear} Điện máy ELC.</TypographySmall>
          <ScrollToTop className={STYLES.scrollToTop}>
            <TypographySmall>Quay lại đầu trang</TypographySmall>
          </ScrollToTop>
        </div>
      </GridSection>

      {/* Schema collections SEO */}
      {(() => {
        const schema = generateCollectionSchema(
          entity.data,
          products,
          location,
          totalCount,
        );
        if (!schema) return null;
        return (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          />
        );
      })()}

      {/* Breadcrumb schema — server-rendered so Google always sees it, see generateBreadcrumbSchema doc */}
      {(() => {
        const currentUrl = location
          ? `${BASE_URL}/san-pham/${entity.data.slug}/${location.slug}`
          : `${BASE_URL}/san-pham/${entity.data.slug}`;
        const breadcrumbSchema = generateBreadcrumbSchema(
          [
            { label: "Sản phẩm", href: "/san-pham" },
            ...(breadcrumbParent ? [breadcrumbParent] : []),
            { label: pageTitle },
          ],
          currentUrl,
        );
        return (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
          />
        );
      })()}

      {/* FAQ Schema */}
      {faqList &&
        faqList.length > 0 &&
        (() => {
          const faqSchema = {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqList.map((item) => ({
              "@type": "Question",
              name: item.question,
              acceptedAnswer: {
                "@type": "Answer",
                text: item.answer,
              },
            })),
          };
          return (
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
            />
          );
        })()}
    </main>
  );
}
