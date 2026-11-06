"use client";
import { Badge } from "@/shared/components/ui/badge";
import Image from "next/image";
import Link from "next/link";
import { ServiceZaloButton } from "./ServiceZaloButton";
import type { ServiceLine } from "../../domain/line";
import type { CtaPlacement } from "@/modules/inquiry/domain";

export interface CardServiceProps {
  id?: string;
  title?: string;
  image?: string;
  description?: string;
  badges?: string[];
  slug?: string;
  line?: ServiceLine;
  briefPrompts?: string[];
  locationSlug?: string;
  // Heading level is decided by where the card sits in the page outline:
  // h2 directly under the page h1 (hub), h3 under an h2 (related services).
  headingAs?: "h2" | "h3";
  // Where this card sits, for tracking: the hub grid or the related-services row.
  placement?: Extract<CtaPlacement, "hub-card" | "related-card">;
}

// Bật/tắt việc click vào card để vào trang chi tiết dịch vụ (mũi tên truy
// cập hiện theo). Từng tắt khi các trang chi tiết chưa có nội dung; bật lại
// 2026-11-06 sau khi các trang đã được viết lại.
const ENABLE_DETAIL_LINK = true;

export function CardService({
  id,
  title,
  image,
  description,
  badges,
  slug,
  line = "dich-vu",
  briefPrompts = [],
  locationSlug,
  headingAs: Heading = "h3",
  placement = "hub-card",
}: CardServiceProps) {
  const imageSrc = image || "/placeholder.png";
  const href = slug
    ? locationSlug
      ? `/dich-vu/${slug}/${locationSlug}`
      : `/dich-vu/${slug}`
    : undefined;
  const isLinked = ENABLE_DETAIL_LINK && !!href;

  return (
    // `group relative`: the title link below stretches over this whole card
    // (see the Heading), so the card itself is the click target.
    <div className="group relative rounded-2xl bg-muted/30 p-1 flex h-full flex-col gap-1.5 border border-border shadow-xs">
      {/* Card con: ảnh + tên + badge + mô tả + giá dịch vụ */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-border bg-background">
        <div className="relative aspect-video w-full overflow-hidden">
          <Image
            src={imageSrc}
            alt={title || ""}
            fill
            sizes="(max-width: 768px) 100vw, 384px"
            className={
              isLinked
                ? "object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                : "object-cover"
            }
          />
        </div>

        <div className="flex flex-1 flex-col gap-2 p-3">
          {/* Tên dịch vụ. Khi bật trang chi tiết, link này phủ kín cả thẻ
              (after:absolute after:inset-0): bấm đâu trong thẻ cũng vào trang
              chi tiết, chỉ có nút Đặt lịch bên dưới nổi lên trên lớp phủ. */}
          <Heading className="type-body-strong line-clamp-2 min-w-0">
            {isLinked ? (
              <Link
                href={href!}
                className="transition-colors group-hover:text-primary after:absolute after:inset-0 after:content-['']"
              >
                {title}
              </Link>
            ) : (
              title
            )}
          </Heading>

          {description && (
            <p className="type-body-sm text-muted-foreground line-clamp-2">
              {description}
            </p>
          )}

          {/* Badge để cuối, sát nút Đặt lịch — mắt lướt tới đây đọc badge
              ngay trước khi quyết định bấm, tăng độ tin tưởng. */}
          {badges && badges.length > 0 && (
            <div className="mt-auto flex flex-wrap gap-1">
              {badges.map((badge, idx) => (
                <Badge key={idx} variant="secondary">
                  {badge}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Nút Zalo nằm ngoài card con. Cùng một component với trang chi tiết
          (ServiceZaloButton): lời nút và tin nhắn theo mảng dịch vụ, tin nhắn
          kèm link riêng của dịch vụ và các dòng thông tin nhân viên cần để
          báo giá. */}
      {slug && (
        <div className="relative z-10 px-1 pb-1">
          <ServiceZaloButton
            id={id ?? ""}
            title={title ?? ""}
            slug={slug}
            line={line}
            briefPrompts={briefPrompts}
            placement={placement}
            className="w-full"
          />
        </div>
      )}
    </div>
  );
}
