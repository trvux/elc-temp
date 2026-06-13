import { getProjects } from "@/modules/project/application";
import { getProducts } from "@/modules/catalog/application";
import { getServices } from "@/modules/service/application";
import { getNews } from "@/modules/news/application";
import { getPages } from "@/modules/page/application";
import { getBranches } from "@/modules/branch/application";
import { getCategories } from "@/modules/category/application";
import { getProjectTypes } from "@/modules/project-type/application";
import { getBrands } from "@/modules/brand/application";
import { getServiceGroups } from "@/modules/service-group/application";
import { formatPrice } from "@/modules/catalog/domain";
import { ProductCard } from "@/modules/catalog/presentation/components/ProductCard";
import { ProjectCard } from "@/modules/project/presentation/components/ProjectCard";
import { CardService, mapServiceToCardData } from "@/modules/service";
import { GridSection } from "@/shared/components/sections/grid-section";
import { setUseStaticClient } from "@/shared/lib/supabase/server";
import { cacheLife, cacheTag } from "next/cache";
import Link from "next/link";
import Image from "next/image";
import { 
  ArrowRight,
  ShoppingBag, 
  Folder, 
  Wrench, 
  BookOpen, 
  Info, 
  MapPin,
  SquaresFour,
  Trademark
} from "@phosphor-icons/react/dist/ssr";
import { sortByOrderIndex } from "@/shared/lib/helpers";
import { 
  TypographyH1, 
  TypographyH2,
  TypographyLead, 
  TypographySmall 
} from "@/shared/components/ui/typography";

interface TiptapNode {
  type?: string;
  text?: string;
  content?: TiptapNode[];
}

function getExcerptFromContent(
  content: unknown,
  fallbackDescription: string | null | undefined,
): string {
  if (!content) return fallbackDescription || "";

  try {
    let doc: TiptapNode | null = null;

    if (typeof content === "string") {
      const trimmed = content.trim();
      if (trimmed.startsWith("{")) {
        doc = JSON.parse(trimmed) as TiptapNode;
      } else {
        const stripped = content
          .replace(/<[^>]*>/g, " ")
          .replace(/\s+/g, " ")
          .trim();
        if (stripped.length > 150) {
          return stripped.substring(0, 150) + "...";
        }
        return stripped || fallbackDescription || "";
      }
    } else if (typeof content === "object" && content !== null) {
      doc = content as TiptapNode;
    }

    if (doc) {
      const textParts: string[] = [];
      const traverse = (node: TiptapNode) => {
        if (node.type === "heading") {
          return;
        }
        if (node.type === "text" && node.text) {
          textParts.push(node.text);
        }
        if (node.content) {
          node.content.forEach(traverse);
        }
      };

      traverse(doc);
      const combinedText = textParts.join(" ").replace(/\s+/g, " ").trim();
      if (combinedText.length > 150) {
        return combinedText.substring(0, 150) + "...";
      }
      return combinedText || fallbackDescription || "";
    }
  } catch (err) {
    console.error("Error parsing news content for excerpt:", err);
  }

  return fallbackDescription || "";
}

async function getCachedNotFoundData() {
  "use cache";
  cacheLife("days");
  cacheTag("products", "projects", "services", "news", "categories", "brands", "layout");
  setUseStaticClient(true);

  const [
    projects, 
    products, 
    services, 
    news, 
    pages, 
    branches,
    categories,
    projectTypes,
    brands,
    serviceGroups
  ] = await Promise.all([
    getProjects({ isPublished: true }),
    getProducts({ isPublished: true }),
    getServices({ isPublished: true }),
    getNews({ isPublished: true }),
    getPages({ isPublished: true }),
    getBranches({ isPublished: true }),
    getCategories(),
    getProjectTypes(),
    getBrands(),
    getServiceGroups(),
  ]);

  const currentYear = new Date().getFullYear();

  return {
    projects: projects || [],
    products: products || [],
    services: services || [],
    news: (news || []).map((item) => ({
      id: item.id,
      title: item.title,
      slug: item.slug,
      image: item.image || "",
      excerpt: getExcerptFromContent(item.content, item.metaDescription),
      formattedDate: item.createdAt
        ? new Date(item.createdAt).toLocaleDateString("vi-VN", {
            day: "numeric",
            month: "numeric",
            year: "numeric",
          })
        : "",
    })),
    pages: sortByOrderIndex(pages || []),
    branches: sortByOrderIndex(branches || []),
    categories: (categories || []).filter((c) => !c.deletedAt),
    projectTypes: (projectTypes || []).filter((pt) => !pt.deletedAt),
    brands: brands || [],
    serviceGroups: serviceGroups || [],
    currentYear,
  };
}

export default async function NotFound() {
  const { 
    projects, 
    products, 
    services, 
    news, 
    pages, 
    branches, 
    categories,
    projectTypes,
    brands,
    serviceGroups,
    currentYear 
  } = await getCachedNotFoundData();

  return (
    <main className="w-full bg-background min-h-screen flex flex-col animate-fade-in-up">
      {/* SECTION 1: 404 Hero */}
      <GridSection
        id="not-found-hero"
        isFirst={true}
        showDiamond={true}
        contentClassName="py-16 md:py-24 flex flex-col items-center text-center gap-6 max-w-2xl mx-auto"
      >
        <h1 className="text-8xl md:text-9xl font-extrabold text-primary/15 tracking-tighter leading-none select-none">
          404
        </h1>
        <div className="space-y-3">
          <TypographyH1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight">
            Trang không tồn tại
          </TypographyH1>
          <TypographyLead className="max-w-md mx-auto text-sm md:text-base text-muted-foreground">
            Xin lỗi, đường dẫn bạn đang truy cập không tồn tại hoặc đã được di chuyển sang địa chỉ mới.
          </TypographyLead>
        </div>
      </GridSection>

      {/* SECTION 2: Product Categories */}
      {categories.length > 0 && (
        <GridSection
          id="not-found-categories"
          isFirst={false}
          showDiamond={true}
          contentClassName="py-12 md:py-16"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 w-full max-w-7xl mx-auto">
            <div className="lg:col-span-4 space-y-2 text-left sticky top-16 lg:top-24 bg-background/95 backdrop-blur-sm z-20 py-4 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0 lg:py-0 lg:bg-transparent lg:backdrop-blur-none h-fit">
              <TypographyH2 className="text-xl md:text-2xl font-bold tracking-tight flex items-center gap-2 justify-start">
                <SquaresFour size={24} className="text-primary" />
                Danh mục sản phẩm
              </TypographyH2>
              <TypographyLead className="text-sm md:text-base text-muted-foreground leading-relaxed">
                Các loại máy lạnh dân dụng, thương mại và hệ thống giải pháp không khí chính hãng.
              </TypographyLead>
            </div>

            <div className="lg:col-span-8 flex flex-col w-full">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/san-pham/${cat.slug}`}
                  className="group flex flex-row justify-between items-center gap-4 sm:gap-6 md:gap-8 py-6 border-b border-border/60 last:border-b-0 no-underline transition-all duration-300 w-full"
                >
                  <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                    <h3 className="text-base sm:text-lg md:text-xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug font-heading">
                      {cat.name}
                    </h3>
                    {cat.metaDescription && (
                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                        {cat.metaDescription}
                      </p>
                    )}
                  </div>
                  {cat.imageUrl && (
                    <div className="shrink-0 relative w-24 h-16 sm:w-36 sm:h-24 rounded-lg overflow-hidden bg-muted/20">
                      <Image
                        src={cat.imageUrl}
                        alt={cat.name}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 640px) 96px, 144px"
                      />
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </GridSection>
      )}

      {/* SECTION 3: Project Categories */}
      {projectTypes.length > 0 && (
        <GridSection
          id="not-found-project-types"
          isFirst={false}
          showDiamond={true}
          contentClassName="py-12 md:py-16"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 w-full max-w-7xl mx-auto">
            <div className="lg:col-span-4 space-y-2 text-left sticky top-16 lg:top-24 bg-background/95 backdrop-blur-sm z-20 py-4 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0 lg:py-0 lg:bg-transparent lg:backdrop-blur-none h-fit">
              <TypographyH2 className="text-xl md:text-2xl font-bold tracking-tight flex items-center gap-2 justify-start">
                <Folder size={24} className="text-primary" />
                Danh mục dự án
              </TypographyH2>
              <TypographyLead className="text-sm md:text-base text-muted-foreground leading-relaxed">
                Phân loại các dự án thi công hệ thống điều hòa trung tâm VRV, Multi và thông gió.
              </TypographyLead>
            </div>

            <div className="lg:col-span-8 flex flex-col w-full">
              {projectTypes.map((pt) => (
                <Link
                  key={pt.id}
                  href={`/du-an/${pt.slug}`}
                  className="group flex flex-row justify-between items-center gap-4 sm:gap-6 md:gap-8 py-6 border-b border-border/60 last:border-b-0 no-underline transition-all duration-300 w-full"
                >
                  <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                    <h3 className="text-base sm:text-lg md:text-xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug font-heading">
                      {pt.name}
                    </h3>
                    {pt.metaDescription && (
                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                        {pt.metaDescription}
                      </p>
                    )}
                  </div>
                  {pt.image && (
                    <div className="shrink-0 relative w-24 h-16 sm:w-36 sm:h-24 rounded-lg overflow-hidden bg-muted/20">
                      <Image
                        src={pt.image}
                        alt={pt.name}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 640px) 96px, 144px"
                      />
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </GridSection>
      )}

      {/* SECTION 4: Brands */}
      {brands.length > 0 && (
        <GridSection
          id="not-found-brands"
          isFirst={false}
          showDiamond={true}
          contentClassName="py-12 md:py-16"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 w-full max-w-7xl mx-auto">
            <div className="lg:col-span-4 space-y-2 text-left sticky top-16 lg:top-24 bg-background/95 backdrop-blur-sm z-20 py-4 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0 lg:py-0 lg:bg-transparent lg:backdrop-blur-none h-fit">
              <TypographyH2 className="text-xl md:text-2xl font-bold tracking-tight flex items-center gap-2 justify-start">
                <Trademark size={24} className="text-primary" />
                Thương hiệu đối tác
              </TypographyH2>
              <TypographyLead className="text-sm md:text-base text-muted-foreground leading-relaxed">
                Sản phẩm phân phối chính hãng từ các thương hiệu điều hòa uy tín hàng đầu.
              </TypographyLead>
            </div>

            <div className="lg:col-span-8 flex flex-col w-full">
              {brands.map((brand) => (
                <Link
                  key={brand.id}
                  href={`/san-pham/${brand.slug}`}
                  className="group flex flex-row justify-between items-center gap-4 sm:gap-6 md:gap-8 py-6 border-b border-border/60 last:border-b-0 no-underline transition-all duration-300 w-full"
                >
                  <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                    <h3 className="text-base sm:text-lg md:text-xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug font-heading">
                      {brand.name}
                    </h3>
                    {brand.metaDescription && (
                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                        {brand.metaDescription}
                      </p>
                    )}
                  </div>
                  {brand.logoUrl && (
                    <div className="shrink-0 relative w-24 h-12 sm:w-36 sm:h-16 rounded-lg overflow-hidden bg-white/5 p-2 flex items-center justify-center">
                      <Image
                        src={brand.logoUrl}
                        alt={brand.name}
                        fill
                        className="object-contain px-2 transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 640px) 96px, 144px"
                      />
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </GridSection>
      )}

      {/* SECTION 5: Service Groups */}
      {serviceGroups.length > 0 && (
        <GridSection
          id="not-found-service-groups"
          isFirst={false}
          showDiamond={true}
          contentClassName="py-12 md:py-16"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 w-full max-w-7xl mx-auto">
            <div className="lg:col-span-4 space-y-2 text-left sticky top-16 lg:top-24 bg-background/95 backdrop-blur-sm z-20 py-4 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0 lg:py-0 lg:bg-transparent lg:backdrop-blur-none h-fit">
              <TypographyH2 className="text-xl md:text-2xl font-bold tracking-tight flex items-center gap-2 justify-start">
                <Wrench size={24} className="text-primary" />
                Nhóm dịch vụ kỹ thuật
              </TypographyH2>
              <TypographyLead className="text-sm md:text-base text-muted-foreground leading-relaxed">
                Các giải pháp khảo sát thiết kế, thi công lắp đặt và bảo dưỡng định kỳ hệ thống lạnh.
              </TypographyLead>
            </div>

            <div className="lg:col-span-8 flex flex-col w-full">
              {serviceGroups.map((sg) => (
                <Link
                  key={sg.id}
                  href={`/dich-vu`}
                  className="group flex flex-row justify-between items-center gap-4 sm:gap-6 md:gap-8 py-6 border-b border-border/60 last:border-b-0 no-underline transition-all duration-300 w-full"
                >
                  <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                    <h3 className="text-base sm:text-lg md:text-xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug font-heading">
                      {sg.name}
                    </h3>
                    {sg.metaDescription && (
                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                        {sg.metaDescription}
                      </p>
                    )}
                  </div>
                  {sg.imageUrl && (
                    <div className="shrink-0 relative w-24 h-16 sm:w-36 sm:h-24 rounded-lg overflow-hidden bg-muted/20">
                      <Image
                        src={sg.imageUrl}
                        alt={sg.name}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 640px) 96px, 144px"
                      />
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </GridSection>
      )}

      {/* SECTION 6: Products */}
      {products.length > 0 && (
        <GridSection
          id="not-found-products"
          isFirst={false}
          showDiamond={true}
          contentClassName="py-12 md:py-16"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 w-full max-w-7xl mx-auto">
            <div className="lg:col-span-4 space-y-2 text-left sticky top-16 lg:top-24 bg-background/95 backdrop-blur-sm z-20 py-4 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0 lg:py-0 lg:bg-transparent lg:backdrop-blur-none h-fit">
              <TypographyH2 className="text-xl md:text-2xl font-bold tracking-tight flex items-center gap-2 justify-start">
                <ShoppingBag size={24} className="text-primary" />
                Sản phẩm nổi bật
              </TypographyH2>
              <TypographyLead className="text-sm md:text-base text-muted-foreground leading-relaxed">
                Các dòng máy lạnh, thiết bị xử lý không khí bán chạy nhất từ đối tác tin cậy.
              </TypographyLead>
            </div>

            <div className="lg:col-span-8 flex flex-col w-full">
              {products.map((prod) => (
                <Link
                  key={prod.id}
                  href={`/san-pham/${prod.slug}`}
                  className="group flex flex-row justify-between items-center gap-4 sm:gap-6 md:gap-8 py-6 border-b border-border/60 last:border-b-0 no-underline transition-all duration-300 w-full"
                >
                  <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                    {prod.brand?.name && (
                      <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">
                        {prod.brand.name}
                      </span>
                    )}
                    <h3 className="text-base sm:text-lg md:text-xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug font-heading">
                      {prod.name}
                    </h3>
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm sm:text-base font-bold text-foreground">
                        {prod.salePrice > 0 ? formatPrice(prod.salePrice) : "Liên hệ"}
                      </span>
                      {prod.originalPrice > prod.salePrice && prod.salePrice > 0 && (
                        <span className="text-xs text-muted-foreground line-through">
                          {formatPrice(prod.originalPrice)}
                        </span>
                      )}
                    </div>
                  </div>
                  {prod.images && prod.images[0] && (
                    <div className="shrink-0 relative w-24 h-16 sm:w-36 sm:h-24 rounded-lg overflow-hidden bg-white p-1 border border-border/40 flex items-center justify-center">
                      <Image
                        src={prod.images[0]}
                        alt={prod.name}
                        fill
                        className="object-contain transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 640px) 96px, 144px"
                      />
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </GridSection>
      )}

      {/* SECTION 7: Projects */}
      {projects.length > 0 && (
        <GridSection
          id="not-found-projects"
          isFirst={false}
          showDiamond={true}
          contentClassName="py-12 md:py-16"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 w-full max-w-7xl mx-auto">
            <div className="lg:col-span-4 space-y-2 text-left sticky top-16 lg:top-24 bg-background/95 backdrop-blur-sm z-20 py-4 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0 lg:py-0 lg:bg-transparent lg:backdrop-blur-none h-fit">
              <TypographyH2 className="text-xl md:text-2xl font-bold tracking-tight flex items-center gap-2 justify-start">
                <Folder size={24} className="text-primary" />
                Dự án tiêu biểu
              </TypographyH2>
              <TypographyLead className="text-sm md:text-base text-muted-foreground leading-relaxed">
                Những công trình thực tế do đội ngũ kỹ sư ELC thi công hoàn thiện bàn giao trên cả nước.
              </TypographyLead>
            </div>

            <div className="lg:col-span-8 flex flex-col w-full">
              {projects.map((proj) => (
                <Link
                  key={proj.id}
                  href={`/du-an/${proj.slug}`}
                  className="group flex flex-row justify-between items-center gap-4 sm:gap-6 md:gap-8 py-6 border-b border-border/60 last:border-b-0 no-underline transition-all duration-300 w-full"
                >
                  <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                    {proj.projectType?.name && (
                      <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">
                        {proj.projectType.name}
                      </span>
                    )}
                    <h3 className="text-base sm:text-lg md:text-xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug font-heading">
                      {proj.title}
                    </h3>
                    {proj.metaDescription && (
                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                        {proj.metaDescription}
                      </p>
                    )}
                  </div>
                  {proj.images && proj.images[0] && (
                    <div className="shrink-0 relative w-24 h-16 sm:w-36 sm:h-24 rounded-lg overflow-hidden bg-muted/20">
                      <Image
                        src={proj.images[0]}
                        alt={proj.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 640px) 96px, 144px"
                      />
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </GridSection>
      )}

      {/* SECTION 8: Services */}
      {services.length > 0 && (
        <GridSection
          id="not-found-services"
          isFirst={false}
          showDiamond={true}
          contentClassName="py-12 md:py-16"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 w-full max-w-7xl mx-auto">
            <div className="lg:col-span-4 space-y-2 text-left sticky top-16 lg:top-24 bg-background/95 backdrop-blur-sm z-20 py-4 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0 lg:py-0 lg:bg-transparent lg:backdrop-blur-none h-fit">
              <TypographyH2 className="text-xl md:text-2xl font-bold tracking-tight flex items-center gap-2 justify-start">
                <Wrench size={24} className="text-primary" />
                Dịch vụ chuyên nghiệp
              </TypographyH2>
              <TypographyLead className="text-sm md:text-base text-muted-foreground leading-relaxed">
                Dịch vụ tư vấn, thiết kế, thi công lắp đặt và bảo dưỡng điều hòa trung tâm chất lượng cao.
              </TypographyLead>
            </div>

            <div className="lg:col-span-8 flex flex-col w-full">
              {services.map((serv) => (
                <Link
                  key={serv.id}
                  href={`/dich-vu/${serv.slug}`}
                  className="group flex flex-row justify-between items-center gap-4 sm:gap-6 md:gap-8 py-6 border-b border-border/60 last:border-b-0 no-underline transition-all duration-300 w-full"
                >
                  <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                    {serv.group?.name && (
                      <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">
                        {serv.group.name}
                      </span>
                    )}
                    <h3 className="text-base sm:text-lg md:text-xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug font-heading">
                      {serv.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                      {serv.metaDescription || serv.description || "Dịch vụ thi công, lắp đặt sửa chữa nhanh chóng."}
                    </p>
                  </div>
                  {serv.image && (
                    <div className="shrink-0 relative w-24 h-16 sm:w-36 sm:h-24 rounded-lg overflow-hidden bg-muted/20">
                      <Image
                        src={serv.image}
                        alt={serv.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 640px) 96px, 144px"
                      />
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </GridSection>
      )}

      {/* SECTION 9: News */}
      {news.length > 0 && (
        <GridSection
          id="not-found-news"
          isFirst={false}
          showDiamond={true}
          contentClassName="py-12 md:py-16"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 w-full max-w-7xl mx-auto">
            <div className="lg:col-span-4 space-y-2 text-left sticky top-16 lg:top-24 bg-background/95 backdrop-blur-sm z-20 py-4 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0 lg:py-0 lg:bg-transparent lg:backdrop-blur-none h-fit">
              <TypographyH2 className="text-xl md:text-2xl font-bold tracking-tight flex items-center gap-2 justify-start">
                <BookOpen size={24} className="text-primary" />
                Tin tức & Giải pháp mới
              </TypographyH2>
              <TypographyLead className="text-sm md:text-base text-muted-foreground leading-relaxed">
                Kiến thức chuyên sâu, cẩm nang sử dụng và cập nhật xu hướng từ đội ngũ chuyên gia ELC.
              </TypographyLead>
            </div>

            <div className="lg:col-span-8 flex flex-col w-full">
              {news.map((item) => (
                <Link
                  key={item.id}
                  href={`/tin-tuc/${item.slug}`}
                  className="group flex flex-row justify-between items-center gap-4 sm:gap-6 md:gap-8 py-6 border-b border-border/60 last:border-b-0 no-underline transition-all duration-300 w-full"
                >
                  <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                    {item.formattedDate && (
                      <span className="text-xs text-muted-foreground font-sans">
                        {item.formattedDate}
                      </span>
                    )}
                    <h3 className="text-base sm:text-lg md:text-xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug font-heading">
                      {item.title}
                    </h3>
                    {item.excerpt && (
                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                        {item.excerpt}
                      </p>
                    )}
                  </div>
                  {item.image && (
                    <div className="shrink-0 relative w-24 h-16 sm:w-36 sm:h-24 rounded-lg overflow-hidden bg-muted/20">
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 640px) 96px, 144px"
                      />
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </GridSection>
      )}

      {/* SECTION 10: Support Pages */}
      {pages.length > 0 && (
        <GridSection
          id="not-found-pages"
          isFirst={false}
          showDiamond={true}
          contentClassName="py-12 md:py-16"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 w-full max-w-7xl mx-auto">
            <div className="lg:col-span-4 space-y-2 text-left sticky top-16 lg:top-24 bg-background/95 backdrop-blur-sm z-20 py-4 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0 lg:py-0 lg:bg-transparent lg:backdrop-blur-none h-fit">
              <TypographyH2 className="text-xl md:text-2xl font-bold tracking-tight flex items-center gap-2 justify-start">
                <Info size={24} className="text-primary" />
                Chính sách & Hướng dẫn hỗ trợ
              </TypographyH2>
              <TypographyLead className="text-sm md:text-base text-muted-foreground leading-relaxed">
                Quy định bảo hành, điều khoản mua bán, hướng dẫn lắp đặt và hỗ trợ dịch vụ khách hàng.
              </TypographyLead>
            </div>

            <div className="lg:col-span-8 flex flex-col w-full">
              {pages.map((page) => (
                <Link
                  key={page.id}
                  href={`/${page.slug}`}
                  className="group flex flex-row justify-between items-center gap-4 py-6 border-b border-border/60 last:border-b-0 no-underline transition-all duration-300 w-full"
                >
                  <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                    <h3 className="text-base sm:text-lg font-bold tracking-tight text-foreground group-hover:text-primary transition-colors line-clamp-1 leading-snug">
                      {page.title}
                    </h3>
                  </div>
                  <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-primary shrink-0 ml-2" />
                </Link>
              ))}
            </div>
          </div>
        </GridSection>
      )}

      {/* SECTION 11: Branches */}
      {branches.length > 0 && (
        <GridSection
          id="not-found-branches"
          isFirst={false}
          showDiamond={true}
          contentClassName="py-12 md:py-16"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 w-full max-w-7xl mx-auto">
            <div className="lg:col-span-4 space-y-2 text-left sticky top-16 lg:top-24 bg-background/95 backdrop-blur-sm z-20 py-4 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0 lg:py-0 lg:bg-transparent lg:backdrop-blur-none h-fit">
              <TypographyH2 className="text-xl md:text-2xl font-bold tracking-tight flex items-center gap-2 justify-start">
                <MapPin size={24} className="text-primary" />
                Hệ thống chi nhánh dịch vụ
              </TypographyH2>
              <TypographyLead className="text-sm md:text-base text-muted-foreground leading-relaxed">
                Mạng lưới chi nhánh showroom và các điểm phục vụ lắp đặt bảo dưỡng nhanh chóng của chúng tôi.
              </TypographyLead>
            </div>

            <div className="lg:col-span-8 flex flex-col w-full">
              {branches.map((branch) => (
                <Link
                  key={branch.id}
                  href={`/thong-tin/${branch.slug}`}
                  className="group flex flex-row justify-between items-center gap-4 py-6 border-b border-border/60 last:border-b-0 no-underline transition-all duration-300 w-full"
                >
                  <div className="flex-1 min-w-0 flex flex-col gap-1">
                    <h3 className="text-base sm:text-lg font-bold tracking-tight text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                      {branch.name}
                    </h3>
                    {branch.address && (
                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                        {branch.address}
                      </p>
                    )}
                  </div>
                  <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-primary shrink-0 ml-2" />
                </Link>
              ))}
            </div>
          </div>
        </GridSection>
      )}

      {/* SECTION 12: Footer copyright */}
      <GridSection
        id="not-found-footer"
        isFirst={false}
        showDiamond={true}
        contentClassName="py-8"
      >
        <footer className="w-full flex flex-col md:flex-row justify-between items-center gap-6 text-muted-foreground">
          <TypographySmall>&copy; {currentYear} Điện máy ELC.</TypographySmall>
          <Link
            href="/"
            className="flex items-center gap-2 hover:text-foreground transition-colors text-sm"
          >
            Quay lại trang chủ ELC
          </Link>
        </footer>
      </GridSection>
    </main>
  );
}
