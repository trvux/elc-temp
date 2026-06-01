import { BranchList, getBranches } from "@/modules/branch";
import { ScrollToTop } from "@/shared/components/layout/user/scroll-to-top";
import {
  TypographyH1,
  TypographyLead,
  TypographySmall,
} from "@/shared/components/ui/typography";
import { cn } from "@/shared/lib/utils";
import { setUseStaticClient } from "@/shared/lib/supabase/server";
import { cacheLife } from "next/cache";

const STYLES = {
  main: cn("w-full min-h-screen py-12 px-4 md:px-8"),
  container: cn("max-w-5xl mx-auto flex flex-col gap-24"),
  header: cn(
    "flex flex-col gap-6 max-w-2xl w-full mx-auto items-center text-center",
  ),
  title: cn(),
  description: cn(),
  footer: cn(
    "border-t pt-12 flex flex-col md:flex-row justify-between items-center gap-8 text-muted-foreground",
  ),
  scrollToTop: cn(
    "flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors",
  ),
};

export default async function BranchesHub() {
  "use cache";
  cacheLife("hours");
  setUseStaticClient(true);

  const allBranches = await getBranches({ isPublished: true });

  return (
    <main className={STYLES.main}>
      <div className={STYLES.container}>
        <header className={STYLES.header}>
          <TypographyH1 className={STYLES.title}>
            Chi nhánh Điện máy ELC
          </TypographyH1>
          <TypographyLead className={STYLES.description}>
            Hệ thống không gian trưng bày và trạm dịch vụ của ELC được mở rộng
            trên toàn quốc với triết lý kiến tạo giá trị đồng nhất.
          </TypographyLead>
        </header>

        <BranchList branches={allBranches} />

        <footer className={STYLES.footer}>
          <TypographySmall>
            &copy; {new Date().getFullYear()} ELC Holdings. Đã đăng ký bản
            quyền.
          </TypographySmall>
          <ScrollToTop className={STYLES.scrollToTop}>
            <TypographySmall>Quay lại đầu trang</TypographySmall>
          </ScrollToTop>
        </footer>
      </div>
    </main>
  );
}
