import { Button } from "@/shared/components/ui/button";
import { House } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="w-full bg-background min-h-[70vh] flex flex-col animate-fade-in-up">
      {/* Section separation is now pure spacing, no divider/diamond — see
          grid-section.tsx's own removal comment (2026-09-24) for why. */}
      <div id="not-found-hero" className="w-full relative flex-1 flex flex-col">
        <div className="mx-auto h-full w-full max-w-350 min-[112.5rem]:max-w-384 px-4 md:px-6 lg:px-12 relative flex-1 flex flex-col items-center justify-center text-center gap-6 max-w-2xl py-16 md:py-24">
        {/* Decorative numeral, not a heading: the page's one <h1> is the title
            below (this used to be a second <h1>). */}
        <p aria-hidden="true" className="type-display text-foreground/15 select-none animate-pulse">
          404
        </p>
        <div className="space-y-3">
          <h1 className="type-headline">Trang không tồn tại</h1>
          <p className="type-body max-w-md mx-auto text-muted-foreground">
            Đường dẫn bạn đang truy cập không tồn tại hoặc đã được di chuyển
            sang địa chỉ mới.
          </p>
        </div>
        <div className="pt-4">
          <Button
            asChild
            size="lg"
            className="type-label bg-foreground text-background hover:bg-foreground/90 transition-all duration-300"
          >
            <Link href="/">
              <House size={18} />
              Quay lại trang chủ
            </Link>
          </Button>
        </div>
        </div>
      </div>
    </main>
  );
}
