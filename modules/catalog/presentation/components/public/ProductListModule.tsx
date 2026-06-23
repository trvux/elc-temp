import { searchProducts } from "@/modules/catalog/application";
import { productRepo } from "@/modules/catalog/infrastructure/SupabaseProductRepository";
import { ResolvedEntity } from "@/modules/catalog/application/resolveProductPath";
import { ProductCard } from "@/modules/catalog/presentation/components/ProductCard";
import { ProductFilterMobile } from "@/modules/catalog/presentation/components/ProductFilterMobile";
import { ProductFilters } from "@/modules/catalog/presentation/components/ProductFilters";
import { getCategories } from "@/modules/category/application";
import { categoryRepo } from "@/modules/category/infrastructure/categoryRepo";
import { Breadcrumbs } from "@/shared/components/layout/user/breadcrumbs";
import { FilteredGridWrapper } from "@/shared/components/layout/user/filtered-grid-wrapper";
import { PreviewContent } from "@/shared/components/layout/user/preview-content";
import { PaginationNav } from "@/shared/components/layout/user/pagination-nav";
import { ProductSearch } from "@/shared/components/layout/user/product-search";
import { ScrollToTop } from "@/shared/components/layout/user/scroll-to-top";
import { GridSection } from "@/shared/components/sections/grid-section";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/shared/components/ui/accordion";
import {
  TypographyH1,
  TypographyH3,
  TypographyLarge,
  TypographySmall,
} from "@/shared/components/ui/typography";
import { getQueryTokens } from "@/shared/lib/search-utils";
import { generateCollectionSchema } from "@/shared/lib/seo-utils";
import { createClient, setUseStaticClient } from "@/shared/lib/supabase/server";
import { cn } from "@/shared/lib/utils";
import { cacheLife, cacheTag } from "next/cache";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { District } from "@/shared/lib/districts";

interface ProductListModuleProps {
  entity: ResolvedEntity;
  searchParams: { [key: string]: string | string[] | undefined };
  location?: District;
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

async function getCachedListModuleData(
  entity: ResolvedEntity,
  q: string,
  minPrice: number | undefined,
  maxPrice: number | undefined,
  brandSlugs: string[],
  specs: Record<string, string[]>,
  currentPage: number,
  pageSize: number,
  condition: string | undefined,
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

  const supabase = await createClient();

  if (entity.type === "brand") {
    brandIds = [entity.data.id];
  } else if (entity.type === "category") {
    categoryIds = [entity.data.id];
    if (entity.data.groupId) {
      const { data: parentGroup } = await supabase
        .from("group_categories")
        .select("name, slug")
        .eq("id", entity.data.groupId)
        .is("deleted_at", null)
        .single();
      if (parentGroup) {
        breadcrumbParent = {
          label: parentGroup.name,
          href: `/san-pham/${parentGroup.slug}`,
        };
      }
    }
  } else if (entity.type === "group") {
    const { data: groupCategories } = await supabase
      .from("categories")
      .select("id, name")
      .eq("group_id", entity.data.id)
      .is("deleted_at", null);
    categoryIds = (groupCategories || [])
      .filter((c) => !c.name.toLowerCase().includes("chưa phân loại"))
      .map((c) => c.id);
  }

  const allCategories = await getCategories(categoryRepo);

  const { products, totalCount, availableFilters } = await searchProducts(productRepo, q, {
    categoryIds,
    brandIds,
    brandSlugs,
    isPublished: true,
    minPrice,
    maxPrice,
    specs,
    condition,
    limit: pageSize,
    offset: (currentPage - 1) * pageSize,
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

function getFallbackContent(entity: ResolvedEntity) {
  if (!entity || entity.type === "product") return null;

  const name = entity.data.name;
  let title = name;
  let p1 = "";
  let p2 = "";

  if (entity.type === "category") {
    title = `Tìm hiểu về ${name} chính hãng`;
    p1 = `${name} chính hãng là giải pháp điều hòa không khí hiện đại, được thiết kế tối ưu để mang lại bầu không khí trong lành, mát mẻ cho mọi không gian sống và làm việc. Với các tính năng vượt trội như công nghệ tiết kiệm điện năng Inverter, màng lọc kháng khuẩn khử mùi tiên tiến và cơ chế vận hành êm ái, dòng sản phẩm này đang là sự lựa chọn hàng đầu của người tiêu dùng. Điện máy ELC tự hào phân phối các dòng máy chính hãng từ các thương hiệu lớn với chính sách hỗ trợ kỹ thuật và bảo hành chuyên nghiệp.`;
    p2 = `Khi chọn mua ${name.toLowerCase()}, quý khách hàng cần lưu ý các yếu tố quan trọng như công suất máy (HP) phù hợp với diện tích phòng, khả năng tiết kiệm năng lượng, các tiện ích thông minh đi kèm và thương hiệu uy tín. Đội ngũ tư vấn giàu kinh nghiệm tại Điện máy ELC luôn sẵn sàng hỗ trợ quý khách khảo sát địa hình thực tế và tư vấn giải pháp lắp đặt tối ưu nhất, đảm bảo tính thẩm mỹ, độ bền cao và hiệu suất hoạt động lâu dài cho toàn bộ hệ thống.`;
  } else if (entity.type === "brand") {
    title = `Tìm hiểu về thương hiệu ${name}`;
    p1 = `Thương hiệu ${name} từ lâu đã khẳng định được vị thế hàng đầu trong ngành công nghiệp điện lạnh nhờ vào chất lượng sản phẩm vượt trội, độ bền cao và công nghệ tiên tiến. Các dòng sản phẩm đến từ hãng luôn đi đầu trong việc tích hợp các giải pháp thông minh, bảo vệ sức khỏe người dùng và thân thiện với môi trường. Điện máy ELC tự hào là đối tác phân phối chính thức các sản phẩm của thương hiệu này, mang đến cho người tiêu dùng những giải pháp làm mát tối ưu và đáng tin cậy nhất.`;
    p2 = `Quý khách hàng khi mua sắm các thiết bị của thương hiệu ${name} tại Điện máy ELC sẽ được hưởng trọn vẹn chính sách bảo hành chính hãng, dịch vụ lắp đặt chuyên nghiệp và chế độ hậu mãi chu đáo. Chúng tôi cam kết cung cấp sản phẩm với mức giá cạnh tranh nhất trên thị trường, đi kèm dịch vụ khảo sát và tư vấn kỹ thuật tận nơi từ đội ngũ chuyên viên giàu kinh nghiệm, giúp tối ưu hóa hiệu quả sử dụng và tiết kiệm tối đa chi phí cho gia đình bạn.`;
  } else if (entity.type === "group") {
    title = `Giới thiệu giải pháp ${name}`;
    p1 = `Danh mục ${name} tại Điện máy ELC tập hợp đa dạng các dòng sản phẩm làm mát từ phân khúc dân dụng đến thương mại, phục vụ mọi nhu cầu sử dụng của hộ gia đình, văn phòng và các dự án công trình quy mô lớn. Chúng tôi luôn cập nhật những dòng máy mới nhất tích hợp công nghệ làm lạnh nhanh, công nghệ biến tần tiết kiệm điện năng và hệ thống lọc khí hiện đại giúp bảo vệ sức khỏe tối đa cho các thành viên trong gia đình.`;
    p2 = `Để sở hữu hệ thống ${name.toLowerCase()} hoạt động hiệu quả và bền bỉ, việc khảo sát thiết kế và lắp đặt đúng tiêu chuẩn kỹ thuật đóng vai trò cực kỳ quan trọng. Đến với Điện máy ELC, quý khách hàng không chỉ nhận được sản phẩm chính hãng 100% với giá tốt nhất và còn được trải nghiệm dịch vụ thi công trọn gói chuyên nghiệp, chuyên sâu từ khâu đi đường ống đến vận hành chạy thử hệ thống, cam kết mang lại sự hài lòng tuyệt đối.`;
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
            text: title
          }
        ]
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: p1
          }
        ]
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: p2
          }
        ]
      }
    ]
  };
}

function getFallbackFaq(entity: ResolvedEntity): Array<{ question: string; answer: string }> {
  if (!entity || entity.type === "product") return [];

  const name = entity.data.name;

  if (entity.type === "category") {
    return [
      {
        question: `Có nên chọn mua ${name} chính hãng tại Điện máy ELC không?`,
        answer: `Có, Điện máy ELC cam kết phân phối sản phẩm chính hãng 100% kèm đầy đủ giấy tờ chứng nhận nguồn gốc xuất xứ, dịch vụ tư vấn kỹ thuật chuyên sâu và chính sách lắp đặt bảo hành uy tín nhất.`
      },
      {
        question: `Sản phẩm ${name} có được hỗ trợ lắp đặt tận nơi hay không?`,
        answer: `Điện máy ELC cung cấp dịch vụ giao hàng và thi công lắp đặt trọn gói chuyên nghiệp bởi đội ngũ kỹ thuật viên giàu kinh nghiệm, tuân thủ nghiêm ngặt quy trình kỹ thuật để đảm bảo máy vận hành tốt nhất.`
      },
      {
        question: `Chính sách bảo hành dành cho ${name} như thế nào?`,
        answer: `Tất cả sản phẩm đều được áp dụng chính sách bảo hành chính hãng theo đúng quy định của nhà sản xuất. Đồng thời, Điện máy ELC hỗ trợ kỹ thuật nhanh chóng khi khách hàng gặp sự cố trong quá trình sử dụng.`
      }
    ];
  } else if (entity.type === "brand") {
    return [
      {
        question: `Sản phẩm của thương hiệu ${name} dùng có tốt và bền không?`,
        answer: `Các thiết bị của hãng nổi tiếng với độ bền vượt trội, khả năng tiết kiệm điện năng xuất sắc và tích hợp nhiều công nghệ tiên tiến nhất, mang đến hiệu suất làm mát ổn định qua nhiều năm sử dụng.`
      },
      {
        question: `Điện máy ELC có phải là đại lý phân phối chính thức của ${name} không?`,
        answer: `Đúng vậy, Điện máy ELC là đối tác phân phối chính thức của thương hiệu này tại Việt Nam, cam kết cung cấp sản phẩm chính hãng chất lượng cao cùng mức giá cực kỳ ưu đãi.`
      },
      {
        question: `Khi mua sản phẩm ${name} thì việc bảo hành sẽ được thực hiện ở đâu?`,
        answer: `Sản phẩm sẽ được bảo hành trực tiếp tại các trung tâm bảo hành ủy quyền của hãng trên toàn quốc. Điện máy ELC cũng hỗ trợ tiếp nhận thông tin và phối hợp xử lý bảo hành nhanh nhất cho khách hàng.`
      }
    ];
  } else if (entity.type === "group") {
    return [
      {
        question: `Làm sao để lựa chọn dòng ${name} phù hợp nhất với nhu cầu sử dụng?`,
        answer: `Quý khách nên xác định diện tích không gian cần làm mát để lựa chọn công suất máy phù hợp, đồng thời cân nhắc các yếu tố như tính năng tiết kiệm điện Inverter, kiểu dáng thiết kế và ngân sách đầu tư.`
      },
      {
        question: `Điện máy ELC có cung cấp đầy đủ các thương hiệu ${name} lớn không?`,
        answer: `Chúng tôi cung cấp đa dạng sản phẩm từ các hãng hàng đầu hiện nay như Daikin, Panasonic, LG, Casper, Mitsubishi và nhiều thương hiệu uy tín khác, đáp ứng tối đa mọi yêu cầu từ phía khách hàng.`
      },
      {
        question: `Giá bán của các dòng ${name} tại Điện máy ELC đã bao gồm chi phí lắp đặt chưa?`,
        answer: `Giá hiển thị trên website là giá bán sản phẩm. Tùy thuộc vào vị trí và độ khó khi thi công thực tế, chi phí vật tư và nhân công lắp đặt sẽ được Điện máy ELC báo giá chi tiết, minh bạch trước khi thực hiện.`
      }
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
  const currentPage = Number(sParams.page) || 1;
  const pageSize = 12;
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

  const displayTitle = location ? `${pageTitle} tại ${location.name}` : pageTitle;

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
    currentPage,
    pageSize,
    condition,
  );

  const queryTokens = getQueryTokens(q);
  const totalPages = Math.ceil(totalCount / pageSize);

  const dbContent = entity.data.content;
  const typedContent = dbContent as { type?: string; content?: unknown[] } | null | undefined;
  const hasDbContent = !!(typedContent && typeof typedContent === "object" && typedContent.type === "doc" && Array.isArray(typedContent.content) && typedContent.content.length > 0);
  const seoContent = hasDbContent ? dbContent : getFallbackContent(entity);

  const dbFaq = entity.data.faq;
  const hasDbFaq = !!(Array.isArray(dbFaq) && dbFaq.length > 0);
  const faqList: Array<{ question: string; answer: string }> = (hasDbFaq && dbFaq) ? dbFaq : getFallbackFaq(entity);

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
            <TypographyH1 className={STYLES.title}>{displayTitle}</TypographyH1>
            <TypographyLarge className="flex items-center gap-x-1 text-sm! md:text-md! lg:text-lg! text-muted-foreground">
              Danh sách{" "}
              <span className="flex gap-x-1 bg-primary text-primary-foreground px-2 rounded-sm items-center font-medium">
                {totalCount} sản phẩm
              </span>{" "}
              thuộc {subTitlePrefix}
            </TypographyLarge>
          </header>
        </div>
      </GridSection>

      {/* ===== KHỐI 2: THANH TÌM KIẾM + BỘ LỌC MOBILE ===== */}
      <GridSection
        id="products-search"
        isFirst={false}
        showDiamond={true}
        contentClassName="py-6 md:py-8 lg:py-10"
      >
        <div className="flex flex-col gap-8 w-full">
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

      {/* ===== KHỐI 3: BỘ LỌC + LƯỚI SẢN PHẨM ===== */}
      <GridSection
        id="products-content"
        isFirst={false}
        showDiamond={true}
        contentClassName="py-6 md:py-8 lg:py-10"
      >
        <div className="flex flex-col lg:flex-row gap-12 w-full items-start">
          <aside className="hidden lg:block w-64 shrink-0 sticky top-28 self-start">
            <ProductFilters
              categories={allCategories}
              availableFilters={availableFilters}
            />
          </aside>

          <div className="flex-1 w-full">
            <FilteredGridWrapper
              fallback={
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-6 md:gap-y-16 min-h-[450px]">
                  {Array.from({ length: 8 }).map((_, index) => (
                    <div key={index} className="flex flex-col gap-4">
                      <Skeleton className="aspect-square w-full rounded-2xl" />
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
                    Hiện chưa có sản phẩm nào trong {subTitlePrefix} này.
                  </p>
                </div>
              )}

              {totalPages > 1 && (
                <div className={STYLES.paginationWrapper}>
                  <PaginationNav
                    currentPage={currentPage}
                    totalPages={totalPages}
                    searchParams={sParams}
                  />
                </div>
              )}
            </FilteredGridWrapper>
          </div>
        </div>
      </GridSection>

      {/* ===== KHỐI 3.5: NỘI DUNG SEO ===== */}
      {!!seoContent && (
        <GridSection
          id="products-seo-content"
          isFirst={false}
          showDiamond={true}
          contentClassName="py-10 border-t border-border/30"
        >
          <div className="w-full max-w-4xl mx-auto">
            <PreviewContent 
              content={seoContent} 
              className="prose-sm md:prose-base text-foreground/80 leading-relaxed" 
              skipFirstHeadingPromotion={true}
            />
          </div>
        </GridSection>
      )}

      {/* ===== KHỐI 3.6: HỎI ĐÁP (FAQ) ===== */}
      {faqList && faqList.length > 0 && (
        <GridSection
          id="products-faq"
          isFirst={false}
          showDiamond={true}
          contentClassName="py-10 border-t border-border/30"
        >
          <div className="w-full max-w-4xl mx-auto space-y-6">
            <TypographyH3 className="text-xl md:text-2xl font-bold tracking-tight">
              Câu hỏi thường gặp (FAQ)
            </TypographyH3>
            <Accordion type="single" collapsible className="w-full">
              {faqList.map((item, index) => (
                <AccordionItem key={index} value={`faq-item-${index}`}>
                  <AccordionTrigger className="text-sm md:text-base font-semibold text-foreground py-4">
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

      {/* ===== KHỐI 4: FOOTER BẢN QUYỀN ===== */}
      <GridSection
        id="products-footer"
        isFirst={false}
        showDiamond={true}
        contentClassName="py-6 md:py-8 lg:py-10"
      >
        <footer className={STYLES.footer}>
          <TypographySmall>&copy; {currentYear} Điện máy ELC.</TypographySmall>
          <ScrollToTop className={STYLES.scrollToTop}>
            <TypographySmall>Quay lại đầu trang</TypographySmall>
          </ScrollToTop>
        </footer>
      </GridSection>

      {/* ===== KHỐI 5: BREADCRUMBS ===== */}
      <GridSection
        id="products-breadcrumbs"
        isFirst={false}
        showDiamond={false}
        contentClassName="py-1"
      >
        <div className="w-full">
          <Breadcrumbs
            items={location ? [
              ...(breadcrumbParent ? [breadcrumbParent] : []),
              { label: pageTitle, href: `/san-pham/${entity.data.slug}` },
              { label: `${pageTitle} tại ${location.name}`, active: true },
            ] : [
              ...(breadcrumbParent ? [breadcrumbParent] : []),
              { label: pageTitle, active: true },
            ]}
          />
        </div>
      </GridSection>

      {/* Dữ liệu cấu trúc Schema SEO */}
      {(() => {
        const schema = generateCollectionSchema(entity.data, products, location);
        if (!schema) return null;
        return (
          <div style={{ display: "none" }}>
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
            />
          </div>
        );
      })()}

      {/* Dữ liệu cấu trúc FAQ Schema */}
      {faqList && faqList.length > 0 && (() => {
        const faqSchema = {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": faqList.map((item) => ({
            "@type": "Question",
            "name": item.question,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": item.answer
            }
          }))
        };
        return (
          <div style={{ display: "none" }}>
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
            />
          </div>
        );
      })()}
    </main>
  );
}
