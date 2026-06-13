import { GridSection } from "@/shared/components/sections/grid-section";
import { Button } from "@/shared/components/ui/button";
import {
  TypographyH1,
  TypographyLead,
} from "@/shared/components/ui/typography";
import { House } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="w-full bg-background min-h-[70vh] flex flex-col animate-fade-in-up">
      <GridSection
        id="not-found-hero"
        isFirst={true}
        showDiamond={true}
        className="flex-1 flex flex-col"
        contentClassName="flex-1 flex flex-col items-center justify-center text-center gap-6 max-w-2xl mx-auto py-16 md:py-24"
      >
        <h1 className="text-8xl md:text-9xl font-extrabold text-foreground/15 tracking-tighter leading-none select-none animate-pulse">
          404
        </h1>
        <div className="space-y-3">
          <TypographyH1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight">
            Trang không tồn tại
          </TypographyH1>
          <TypographyLead className="max-w-md mx-auto text-sm md:text-base text-muted-foreground">
            Đường dẫn bạn đang truy cập không tồn tại hoặc đã được di chuyển
            sang địa chỉ mới.
          </TypographyLead>
        </div>
        <div className="pt-4">
          <Button
            asChild
            size="lg"
            className="bg-foreground text-background font-semibold hover:bg-foreground/90 transition-all duration-300"
          >
            <Link href="/">
              <House size={18} />
              Quay lại trang chủ
            </Link>
          </Button>
        </div>
      </GridSection>
    </main>
  );
}
