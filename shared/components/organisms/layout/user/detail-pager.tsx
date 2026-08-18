import { Card } from "@/shared/components/ui/card";
import {
  TypographyMuted,
  TypographySmall,
} from "@/shared/components/ui/typography";
import { cn } from "@/shared/lib/utils";
import { ArrowLeft, ArrowRight } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

export interface DetailPagerItem {
  title: string;
  href: string;
}

interface DetailPagerProps {
  prev?: DetailPagerItem | null;
  next?: DetailPagerItem | null;
  /** Nhãn nhỏ phía trên (vd "Trước", "Sau"). */
  prevLabel?: string;
  nextLabel?: string;
  className?: string;
}

const cardBase = cn(
  "group/pager flex h-full min-w-0 flex-row items-center gap-3 p-4 md:gap-4 md:p-6",
  "ring-foreground/10 transition-colors hover:bg-muted/40 hover:ring-foreground/25",
);

const iconBase = cn(
  "size-5 shrink-0 text-muted-foreground transition-colors",
  "group-hover/pager:text-foreground",
);

/**
 * Điều hướng dạng "Previous / Next" giữa các trang chi tiết liền kề
 * (dự án, sản phẩm, ...). Luôn chia hai cột trái/phải ở mọi kích thước màn hình.
 * Dùng chung, không gắn với domain cụ thể.
 */
export function DetailPager({
  prev,
  next,
  prevLabel = "Trước",
  nextLabel = "Sau",
  className,
}: DetailPagerProps) {
  if (!prev && !next) return null;

  return (
    <nav
      className={cn("grid grid-cols-2 gap-3 md:gap-4", className)}
      aria-label="Điều hướng giữa các trang"
    >
      {prev ? (
        <Link href={prev.href} className="min-w-0">
          <Card className={cardBase}>
            <ArrowLeft className={iconBase} />
            <div className="flex min-w-0 flex-col gap-0.5 text-left">
              <TypographyMuted>{prevLabel}</TypographyMuted>
              <TypographySmall className="block truncate font-semibold text-foreground">
                {prev.title}
              </TypographySmall>
            </div>
          </Card>
        </Link>
      ) : (
        <div />
      )}

      {next ? (
        <Link href={next.href} className="min-w-0">
          <Card className={cn(cardBase, "justify-end text-right")}>
            <div className="flex min-w-0 flex-col gap-0.5 text-right">
              <TypographyMuted>{nextLabel}</TypographyMuted>
              <TypographySmall className="block truncate font-semibold text-foreground">
                {next.title}
              </TypographySmall>
            </div>
            <ArrowRight className={iconBase} />
          </Card>
        </Link>
      ) : (
        <div />
      )}
    </nav>
  );
}
