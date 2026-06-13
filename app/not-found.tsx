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
import { GridSection } from "@/shared/components/sections/grid-section";
import { setUseStaticClient } from "@/shared/lib/supabase/server";
import { cacheLife, cacheTag } from "next/cache";
import Link from "next/link";
import { 
  ShoppingBag, 
  Folder, 
  Wrench, 
  BookOpen, 
  Info, 
  MapPin,
  ArrowRight,
  Tag,
  SquaresFour,
  List,
  Trademark
} from "@phosphor-icons/react/dist/ssr";
import { sortByOrderIndex } from "@/shared/lib/helpers";
import { 
  TypographyH1, 
  TypographyH2,
  TypographyLead, 
  TypographySmall 
} from "@/shared/components/ui/typography";

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
    getProjects({ isPublished: true, limit: 6 }),
    getProducts({ isPublished: true, limit: 6 }),
    getServices({ isPublished: true }),
    getNews({ isPublished: true, limit: 6 }),
    getPages({ isPublished: true }),
    getBranches({ isPublished: true }),
    getCategories(),
    getProjectTypes(),
    getBrands({ limit: 12 }),
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
    <main className="w-full bg-background min-h-screen flex flex-col">
      {/* SECTION 1: 404 Hero */}
      <GridSection
        id="not-found-hero"
        isFirst={true}
        showDiamond={true}
        contentClassName="py-16 md:py-24 flex flex-col items-center text-center gap-6 max-w-2xl mx-auto"
      >
        <h1 className="text-8xl md:text-9xl font-extrabold text-primary/15 tracking-tighter leading-none">
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

      {/* SECTION 2: Rich Exploration Content */}
      <GridSection
        id="not-found-explore"
        isFirst={false}
        showDiamond={true}
        contentClassName="py-12 md:py-16 lg:py-20"
      >
        <div className="flex flex-col gap-10 w-full animate-fade-in-up">
          <div className="space-y-2 text-center md:text-left">
            <TypographyH2 className="text-xl md:text-2xl font-bold tracking-tight">
              Khám phá Điện máy ELC
            </TypographyH2>
            <TypographyLead className="text-sm md:text-base text-muted-foreground">
              Hãy tiếp tục khám phá các danh mục, dịch vụ và sản phẩm nổi bật của chúng tôi dưới đây.
            </TypographyLead>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
            {/* Products (Sản phẩm) */}
            <div className="flex flex-col gap-4 p-6 rounded-lg border border-border/40 bg-card/30 backdrop-blur-sm hover:border-primary/30 transition-all duration-300">
              <h3 className="flex items-center gap-2 font-bold text-lg text-foreground border-b border-border/60 pb-3 mb-2 font-heading">
                <ShoppingBag size={20} className="text-primary shrink-0" />
                Sản phẩm nổi bật
              </h3>
              {products.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">Đang cập nhật sản phẩm...</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {products.map((product) => {
                    const price = product.salePrice || product.originalPrice || 0;
                    return (
                      <Link
                        key={product.id}
                        href={`/san-pham/${product.slug}`}
                        className="group/item flex flex-col gap-0.5 text-sm py-1 border-b border-dashed border-border/45 last:border-0"
                      >
                        <span className="font-medium text-foreground group-hover/item:text-primary transition-colors line-clamp-1">
                          {product.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {price > 0 ? formatPrice(price) : "Liên hệ"}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Projects (Dự án) */}
            <div className="flex flex-col gap-4 p-6 rounded-lg border border-border/40 bg-card/30 backdrop-blur-sm hover:border-primary/30 transition-all duration-300">
              <h3 className="flex items-center gap-2 font-bold text-lg text-foreground border-b border-border/60 pb-3 mb-2 font-heading">
                <Folder size={20} className="text-primary shrink-0" />
                Dự án tiêu biểu
              </h3>
              {projects.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">Đang cập nhật dự án...</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {projects.map((project) => (
                    <Link
                      key={project.id}
                      href={`/du-an/${project.slug}`}
                      className="group/item flex items-center justify-between text-sm py-2 border-b border-dashed border-border/45 last:border-0"
                    >
                      <span className="font-medium text-foreground group-hover/item:text-primary transition-colors line-clamp-1">
                        {project.title}
                      </span>
                      <ArrowRight size={14} className="opacity-0 group-hover/item:opacity-100 transition-opacity text-primary shrink-0 ml-2" />
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Services (Dịch vụ) */}
            <div className="flex flex-col gap-4 p-6 rounded-lg border border-border/40 bg-card/30 backdrop-blur-sm hover:border-primary/30 transition-all duration-300">
              <h3 className="flex items-center gap-2 font-bold text-lg text-foreground border-b border-border/60 pb-3 mb-2 font-heading">
                <Wrench size={20} className="text-primary shrink-0" />
                Dịch vụ chuyên nghiệp
              </h3>
              {services.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">Đang cập nhật dịch vụ...</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {services.map((service) => (
                    <Link
                      key={service.id}
                      href={`/dich-vu/${service.slug}`}
                      className="group/item flex items-center justify-between text-sm py-2 border-b border-dashed border-border/45 last:border-0"
                    >
                      <span className="font-medium text-foreground group-hover/item:text-primary transition-colors line-clamp-1">
                        {service.title}
                      </span>
                      <ArrowRight size={14} className="opacity-0 group-hover/item:opacity-100 transition-opacity text-primary shrink-0 ml-2" />
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* News (Tin tức) */}
            <div className="flex flex-col gap-4 p-6 rounded-lg border border-border/40 bg-card/30 backdrop-blur-sm hover:border-primary/30 transition-all duration-300">
              <h3 className="flex items-center gap-2 font-bold text-lg text-foreground border-b border-border/60 pb-3 mb-2 font-heading">
                <BookOpen size={20} className="text-primary shrink-0" />
                Tin tức & Giải pháp
              </h3>
              {news.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">Đang cập nhật tin tức...</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {news.map((item) => (
                    <Link
                      key={item.id}
                      href={`/tin-tuc/${item.slug}`}
                      className="group/item flex flex-col gap-0.5 text-sm py-1 border-b border-dashed border-border/45 last:border-0"
                    >
                      <span className="font-medium text-foreground group-hover/item:text-primary transition-colors line-clamp-1">
                        {item.title}
                      </span>
                      {item.formattedDate && (
                        <span className="text-xs text-muted-foreground">
                          {item.formattedDate}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Info Pages (Thông tin) */}
            <div className="flex flex-col gap-4 p-6 rounded-lg border border-border/40 bg-card/30 backdrop-blur-sm hover:border-primary/30 transition-all duration-300">
              <h3 className="flex items-center gap-2 font-bold text-lg text-foreground border-b border-border/60 pb-3 mb-2 font-heading">
                <Info size={20} className="text-primary shrink-0" />
                Thông tin & Hỗ trợ
              </h3>
              {pages.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">Đang cập nhật chính sách...</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {pages.map((page) => (
                    <Link
                      key={page.id}
                      href={`/${page.slug}`}
                      className="group/item flex items-center justify-between text-sm py-2 border-b border-dashed border-border/45 last:border-0"
                    >
                      <span className="font-medium text-foreground group-hover/item:text-primary transition-colors line-clamp-1">
                        {page.title}
                      </span>
                      <ArrowRight size={14} className="opacity-0 group-hover/item:opacity-100 transition-opacity text-primary shrink-0 ml-2" />
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Branches (Cơ sở hạ tầng) */}
            <div className="flex flex-col gap-4 p-6 rounded-lg border border-border/40 bg-card/30 backdrop-blur-sm hover:border-primary/30 transition-all duration-300">
              <h3 className="flex items-center gap-2 font-bold text-lg text-foreground border-b border-border/60 pb-3 mb-2 font-heading">
                <MapPin size={20} className="text-primary shrink-0" />
                Cơ sở hạ tầng
              </h3>
              {branches.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">Đang cập nhật hệ thống cơ sở...</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {branches.map((branch) => (
                    <Link
                      key={branch.id}
                      href={`/thong-tin/${branch.slug}`}
                      className="group/item flex flex-col gap-0.5 text-sm py-1 border-b border-dashed border-border/45 last:border-0"
                    >
                      <span className="font-medium text-foreground group-hover/item:text-primary transition-colors line-clamp-1">
                        {branch.name}
                      </span>
                      <span className="text-xs text-muted-foreground line-clamp-1">
                        {branch.address}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </GridSection>

      {/* SECTION 3: Categories & Brands Exploration */}
      <GridSection
        id="not-found-categories"
        isFirst={false}
        showDiamond={true}
        contentClassName="py-12 md:py-16 lg:py-20"
      >
        <div className="flex flex-col gap-10 w-full animate-fade-in-up">
          <div className="space-y-2 text-center md:text-left">
            <TypographyH2 className="text-xl md:text-2xl font-bold tracking-tight">
              Danh mục & Thương hiệu
            </TypographyH2>
            <TypographyLead className="text-sm md:text-base text-muted-foreground">
              Truy cập nhanh các danh mục sản phẩm, phân loại dự án, nhóm dịch vụ và đối tác thương hiệu của chúng tôi.
            </TypographyLead>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 w-full">
            {/* Product Categories (Danh mục sản phẩm) */}
            <div className="flex flex-col gap-4 p-6 rounded-lg border border-border/40 bg-card/30 backdrop-blur-sm hover:border-primary/30 transition-all duration-300">
              <h3 className="flex items-center gap-2 font-bold text-lg text-foreground border-b border-border/60 pb-3 mb-2 font-heading">
                <SquaresFour size={20} className="text-primary shrink-0" />
                Danh mục sản phẩm
              </h3>
              {categories.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">Đang cập nhật danh mục...</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {categories.map((category) => (
                    <Link
                      key={category.id}
                      href={`/san-pham/${category.slug}`}
                      className="group/item flex items-center justify-between text-sm py-2 border-b border-dashed border-border/45 last:border-0"
                    >
                      <span className="font-medium text-foreground group-hover/item:text-primary transition-colors line-clamp-1">
                        {category.name}
                      </span>
                      <ArrowRight size={14} className="opacity-0 group-hover/item:opacity-100 transition-opacity text-primary shrink-0 ml-2" />
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Project Categories (Danh mục dự án) */}
            <div className="flex flex-col gap-4 p-6 rounded-lg border border-border/40 bg-card/30 backdrop-blur-sm hover:border-primary/30 transition-all duration-300">
              <h3 className="flex items-center gap-2 font-bold text-lg text-foreground border-b border-border/60 pb-3 mb-2 font-heading">
                <Folder size={20} className="text-primary shrink-0" />
                Danh mục dự án
              </h3>
              {projectTypes.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">Đang cập nhật phân loại...</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {projectTypes.map((type) => (
                    <Link
                      key={type.id}
                      href={`/du-an/${type.slug}`}
                      className="group/item flex items-center justify-between text-sm py-2 border-b border-dashed border-border/45 last:border-0"
                    >
                      <span className="font-medium text-foreground group-hover/item:text-primary transition-colors line-clamp-1">
                        {type.name}
                      </span>
                      <ArrowRight size={14} className="opacity-0 group-hover/item:opacity-100 transition-opacity text-primary shrink-0 ml-2" />
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Service Groups (Nhóm dịch vụ) */}
            <div className="flex flex-col gap-4 p-6 rounded-lg border border-border/40 bg-card/30 backdrop-blur-sm hover:border-primary/30 transition-all duration-300">
              <h3 className="flex items-center gap-2 font-bold text-lg text-foreground border-b border-border/60 pb-3 mb-2 font-heading">
                <List size={20} className="text-primary shrink-0" />
                Nhóm dịch vụ
              </h3>
              {serviceGroups.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">Đang cập nhật nhóm dịch vụ...</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {serviceGroups.map((group) => (
                    <Link
                      key={group.id}
                      href="/dich-vu"
                      className="group/item flex items-center justify-between text-sm py-2 border-b border-dashed border-border/45 last:border-0"
                    >
                      <span className="font-medium text-foreground group-hover/item:text-primary transition-colors line-clamp-1">
                        {group.name}
                      </span>
                      <ArrowRight size={14} className="opacity-0 group-hover/item:opacity-100 transition-opacity text-primary shrink-0 ml-2" />
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Brands (Thương hiệu) */}
            <div className="flex flex-col gap-4 p-6 rounded-lg border border-border/40 bg-card/30 backdrop-blur-sm hover:border-primary/30 transition-all duration-300">
              <h3 className="flex items-center gap-2 font-bold text-lg text-foreground border-b border-border/60 pb-3 mb-2 font-heading">
                <Trademark size={20} className="text-primary shrink-0" />
                Thương hiệu nổi bật
              </h3>
              {brands.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">Đang cập nhật thương hiệu...</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {brands.map((brand) => (
                    <Link
                      key={brand.id}
                      href={`/san-pham/${brand.slug}`}
                      className="group/item flex items-center justify-between text-sm py-2 border-b border-dashed border-border/45 last:border-0"
                    >
                      <span className="font-medium text-foreground group-hover/item:text-primary transition-colors line-clamp-1">
                        {brand.name}
                      </span>
                      <ArrowRight size={14} className="opacity-0 group-hover/item:opacity-100 transition-opacity text-primary shrink-0 ml-2" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </GridSection>

      {/* SECTION 4: Footer copyright */}
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
