import { BranchList } from "@/modules/branch";
import { getBranches } from "@/modules/branch/application";
import { branchRepo } from "@/modules/branch/infrastructure/branchRepo";
import { getPages } from "@/modules/page/application";
import { pageRepo } from "@/modules/page/infrastructure/SupabasePageRepository";
import { ScrollToTop } from "@/shared/components/layout/user/scroll-to-top";
import { GridSection } from "@/shared/components/sections/grid-section";
import {
  TypographyH1,
  TypographyH4,
  TypographyLead,
  TypographyP,
  TypographySmall,
} from "@/shared/components/ui/typography";
import { sortByOrderIndex } from "@/shared/lib/helpers";
import { setUseStaticClient } from "@/shared/lib/supabase/server";
import { cn } from "@/shared/lib/utils";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import { cacheLife, cacheTag } from "next/cache";
import Link from "next/link";
import { ScrollToActiveBranch } from "./ScrollToActiveBranch";
import { generateSystemPageMetadata } from "@/shared/lib/seo-utils";
import type { Metadata } from "next";
import { getCachedSystemPage } from "@/shared/lib/cached-system-page";

export async function generateMetadata(): Promise<Metadata> {
  const systemPage = await getCachedSystemPage("thong-tin");
  return generateSystemPageMetadata(
    systemPage,
    "Thông tin về ELC | Điện máy ELC",
    "Các chính sách thương mại và dịch vụ công ty cam kết luôn luôn theo đuổi cam kết thực hiện",
    "/thong-tin"
  ) as Metadata;
}

const STYLES = {
  header: cn(
    "flex flex-col gap-6 max-w-2xl w-full mx-auto items-center text-center",
  ),
  title: cn(),
  description: cn(),
  list: cn(
    "flex flex-col justify-center gap-4 min-h-[200px] animate-fade-in-up max-w-3xl w-full mx-auto",
  ),
  article: cn(
    "group flex flex-col gap-6 no-underline transition-all duration-300 p-6 border-b border-border last:border-b-0",
  ),
  articleHeader: cn("flex justify-between items-start gap-4"),

  articleIcon: cn(
    "w-5 h-5 shrink-0 text-muted-foreground/40 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all",
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
  cacheTag("layout");
  setUseStaticClient(true);

  const allPages = await getPages(pageRepo, { isPublished: true });
  const allBranches = await getBranches(branchRepo, { isPublished: true });
  const currentYear = new Date().getFullYear();

  return {
    allPages: sortByOrderIndex(allPages ?? []),
    allBranches: sortByOrderIndex(allBranches ?? []),
    currentYear,
  };
}

export default async function InformationHub({
  params,
}: {
  params?: Promise<{ slug?: string }>;
}) {
  const resolvedParams = params ? await params : undefined;
  const slug = resolvedParams?.slug;

  const { allPages, allBranches, currentYear } =
    await getCachedInformationData();

  return (
    <main className="w-full bg-background min-h-screen">
      <ScrollToActiveBranch slug={slug} />
      {/* Section 1: Thong tin ve ELC */}
      <GridSection
        id="info-section"
        isFirst={true}
        showDiamond={true}
        contentClassName="py-12 md:py-16 lg:py-20 flex flex-col gap-12"
      >
        <header className={STYLES.header}>
          <TypographyH1>Thông tin về ELC</TypographyH1>
          <TypographyLead>
            Các chính sách thương mại và dịch vụ công ty cam kết luôn luôn theo
            đuổi cam kết thực hiện
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
                prefetch={false}
              >
                <div className={STYLES.articleHeader}>
                  <TypographyH4>{page.title}</TypographyH4>
                  <ArrowUpRight className={STYLES.articleIcon} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </GridSection>

      {/* Section 2: Co so ha tang cua ELC */}
      <GridSection
        id="branches-section"
        isFirst={false}
        showDiamond={true}
        contentClassName="py-12 md:py-16 lg:py-20 flex flex-col gap-12"
      >
        <header className={STYLES.header}>
          <TypographyH1>Cơ sở hạ tầng</TypographyH1>
          <TypographyLead>
            Hệ thống không gian trưng bày và trạm dịch vụ của ELC được mở rộng
            trên toàn quốc với triết lý kiến tạo giá trị đồng nhất
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
          <TypographySmall>&copy; {currentYear} Điện máy ELC.</TypographySmall>
          <ScrollToTop className={STYLES.scrollToTop}>
            <TypographySmall>Quay lại đầu trang</TypographySmall>
          </ScrollToTop>
        </footer>
      </GridSection>
    </main>
  );
}
