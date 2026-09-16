"use client";
import { Badge } from "@/shared/components/ui/badge";
import { Button, buttonVariants } from "@/shared/components/ui/button";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import Link from "next/link";

export interface CardServiceProps {
  title?: string;
  price?: string;
  image?: string;
  description?: string;
  badges?: string[];
  slug?: string;
  locationSlug?: string;
}

// Tạm thời tắt việc click vào card để vào trang chi tiết dịch vụ —
// khách chỉ dừng ở trang /dich-vu và bấm "Đặt lịch". Đổi lại thành `true`
// khi cần bật lại trang chi tiết (mũi tên truy cập sẽ hiện lại theo).
const ENABLE_DETAIL_LINK = false;

export function CardService({
  title,
  price,
  image,
  description,
  badges,
  slug,
  locationSlug,
}: CardServiceProps) {
  const imageSrc = image || "/placeholder.png";
  const href = slug
    ? locationSlug
      ? `/dich-vu/${slug}/${locationSlug}`
      : `/dich-vu/${slug}`
    : undefined;
  const isLinked = ENABLE_DETAIL_LINK && !!href;

  return (
    <div className="rounded-2xl bg-muted/30 p-1 flex h-full flex-col gap-1.5 border border-border shadow-xs">
      {/* Card con: ảnh dịch vụ */}
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-background border border-border">
        <Image
          src={imageSrc}
          alt={title || ""}
          fill
          sizes="(max-width: 768px) 100vw, 384px"
          className="object-cover"
        />
      </div>

      {/* Header: tên dịch vụ (trái) + mũi tên truy cập (phải, chỉ hiện khi bật lại trang chi tiết) */}
      <div className="flex items-center justify-between gap-3 px-2 py-1">
        <h3 className="font-heading text-base font-medium leading-tight line-clamp-1 min-w-0">
          {isLinked ? (
            <Link href={href!} className="hover:text-primary transition-colors">
              {title}
            </Link>
          ) : (
            title
          )}
        </h3>
        {isLinked && (
          <Link
            href={href!}
            aria-label={`Xem chi tiết ${title}`}
            className={buttonVariants({ variant: "ghost", size: "icon-sm", className: "shrink-0" })}
          >
            <ArrowRight weight="bold" />
          </Link>
        )}
      </div>

      {/* Display badges if exists */}
      {badges && badges.length > 0 && (
        <div className="flex flex-wrap gap-1 px-2">
          {badges.map((badge, idx) => (
            <Badge key={idx} variant="secondary">
              {badge}
            </Badge>
          ))}
        </div>
      )}

      {description && (
        <p className="px-2 text-sm text-muted-foreground line-clamp-2">
          {description}
        </p>
      )}

      {/* Footer: giá + đặt lịch (giữ nguyên như card cũ) */}
      <div className="mt-auto flex w-full flex-col gap-2 px-2 pb-1">
        <div
          className="flex h-9 w-full items-center justify-center rounded-md bg-secondary px-3 text-sm font-semibold text-secondary-foreground truncate"
          title={price}
        >
          {price}
        </div>

        <Button asChild className="w-full">
          <a
            href="https://zalo.me/0789978898"
            target="_blank"
            rel="noopener noreferrer"
          >
            Đặt lịch
          </a>
        </Button>
      </div>
    </div>
  );
}
