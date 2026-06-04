import {
  TypographyH1,
  TypographyH2,
  TypographyH4,
  TypographyLead,
  TypographyP,
  TypographySmall,
} from "@/shared/components/ui/typography";
import { ScrollToTop } from "@/shared/components/layout/user/scroll-to-top";
import { cn } from "@/shared/lib/utils";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { getPages } from "@/modules/page/application";
import { BranchList, getBranches } from "@/modules/branch";
import { GridSection } from "@/shared/components/sections/grid-section";
import { setUseStaticClient } from "@/shared/lib/supabase/server";
import { cacheLife } from "next/cache";

const STYLES = {
  header: cn(
    "flex flex-col gap-6 max-w-2xl w-full mx-auto items-center text-center",
  ),
  title: cn(),
  description: cn(),
  list: cn("grid grid-cols-1 md:grid-cols-2 gap-8 min-h-[200px] animate-fade-in-up"),
  article: cn(
    "group flex flex-col gap-6 no-underline transition-all duration-300 p-6 rounded-lg border border-border/50 bg-background/50 backdrop-blur-sm shadow-sm hover:shadow-md hover:border-primary/20",
  ),
  articleHeader: cn("flex justify-between items-start gap-4"),
  articleTitle: cn("text-primary/70 group-hover:text-primary transition-colors"),
  articleIcon: cn(
    "w-5 h-5 shrink-0 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all",
  ),
  footer: cn(
    "flex flex-col md:flex-row justify-between items-center gap-8 text-muted-foreground w-full",
  ),
  scrollToTop: cn(
    "flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors",
  ),
};

async function getCachedInformationData() {
  "use cache";
  cacheLife("hours");
  setUseStaticClient(true);

  const allPages = await getPages({ isPublished: true });
  const allBranches = await getBranches({ isPublished: true });
  const currentYear = new Date().getFullYear();

  return {
    allPages: allPages ?? [],
    allBranches: allBranches ?? [],
    currentYear,
  };
}

export default async function InformationHub() {
  const { allPages, allBranches, currentYear } = await getCachedInformationData();

  return (
    <main className="w-full bg-background min-h-screen">
      {/* Section 1: Thong tin ve ELC */}
      <GridSection
        id="info-section"
        isFirst={true}
        showDiamond={true}
        contentClassName="py-12 md:py-16 lg:py-20 flex flex-col gap-12"
      >
        <header className={STYLES.header}>
          <TypographyH1 className={STYLES.title}>Thông tin về ELC</TypographyH1>
          <TypographyLead className={STYLES.description}>
            Kho lưu trữ minh bạch về các giá trị cốt lõi, cam kết bảo hành và
            triết lý kiến tạo.
          </TypographyLead>
        </header>

        {allPages.length === 0 ? (
          <div className="text-center py-10 min-h-[200px] flex items-center justify-center border border-dashed rounded-lg bg-background/50 backdrop-blur-sm">
            <TypographyP className="text-muted-foreground">
              Chưa có thông tin nào được cập nhật.
            </TypographyP>
          </div>
        ) : (
          <div className={STYLES.list}>
            {allPages.map((page) => (
              <Link
                key={page.id}
                href={`/${page.slug}`}
                className={STYLES.article}
              >
                <div className={STYLES.articleHeader}>
                  <TypographyH4 className={STYLES.articleTitle}>
                    {page.title}
                  </TypographyH4>
                  <ArrowUpRight className={STYLES.articleIcon} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </GridSection>

      {/* Section 2: Chi nhanh cua ELC */}
      <GridSection
        id="branches-section"
        isFirst={false}
        showDiamond={true}
        contentClassName="py-12 md:py-16 lg:py-20 flex flex-col gap-12"
      >
        <header className={STYLES.header}>
          <TypographyH2 className={STYLES.title}>
            Chi nhánh của ELC
          </TypographyH2>
          <TypographyLead className={STYLES.description}>
            Hệ thống không gian trưng bày và trạm dịch vụ của ELC được mở rộng
            trên toàn quốc với triết lý kiến tạo giá trị đồng nhất.
          </TypographyLead>
        </header>

        <BranchList branches={allBranches} />
      </GridSection>

      {/* Footer Section */}
      <GridSection
        id="info-footer"
        isFirst={false}
        showDiamond={true}
        contentClassName="py-8"
      >
        <footer className={STYLES.footer}>
          <TypographySmall>
            &copy; {currentYear} ELC Holdings. Đã đăng ký bản
            quyền.
          </TypographySmall>
          <ScrollToTop className={STYLES.scrollToTop}>
            <TypographySmall>Quay lại đầu trang</TypographySmall>
          </ScrollToTop>
        </footer>
      </GridSection>
    </main>
  );
}
