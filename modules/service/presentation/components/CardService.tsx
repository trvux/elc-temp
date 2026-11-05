"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { trackContactClick } from "@/modules/inquiry";
import { ZaloContactModal } from "@/shared/components/organisms/layout/user/zalo-contact-modal";
import { buildZaloServiceMessage, isMobileDevice } from "@/shared/lib/zalo-message";
import { useContacts } from "@/shared/providers/contact-provider";

export interface CardServiceProps {
  id?: string;
  title?: string;
  price?: string;
  image?: string;
  description?: string;
  badges?: string[];
  slug?: string;
  locationSlug?: string;
  // Heading level is decided by where the card sits in the page outline:
  // h2 directly under the page h1 (hub), h3 under an h2 (related services).
  headingAs?: "h2" | "h3";
}

// Bật/tắt việc click vào card để vào trang chi tiết dịch vụ (mũi tên truy
// cập hiện theo). Từng tắt khi các trang chi tiết chưa có nội dung; bật lại
// 2026-11-06 sau khi các trang đã được viết lại.
const ENABLE_DETAIL_LINK = true;

export function CardService({
  id,
  title,
  price,
  image,
  description,
  badges,
  slug,
  locationSlug,
  headingAs: Heading = "h3",
}: CardServiceProps) {
  const imageSrc = image || "/placeholder.png";
  const href = slug
    ? locationSlug
      ? `/dich-vu/${slug}/${locationSlug}`
      : `/dich-vu/${slug}`
    : undefined;
  const isLinked = ENABLE_DETAIL_LINK && !!href;

  const [modalOpen, setModalOpen] = useState(false);
  const contacts = useContacts();
  const zaloContact =
    contacts.find((c) => c.type === "zalo" && c.isActive) || contacts.find((c) => c.type === "zalo");
  const phoneContact =
    contacts.find((c) => c.type === "phone" && c.isActive) || contacts.find((c) => c.type === "phone");
  // Falls back to the same hardcoded number the old plain link used, for
  // the edge case where contacts haven't loaded/aren't configured — the
  // booking button should never just disappear.
  const zaloHref = zaloContact?.href ?? "https://zalo.me/0789978898";
  const zaloPhoneValue = zaloContact?.value ?? "0789978898";
  const message = slug ? buildZaloServiceMessage({ serviceName: title ?? "", priceDisplay: price ?? "", serviceSlug: slug }) : undefined;

  const handleBookClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (isMobileDevice()) {
      // Copy fire-and-forget, no preventDefault — let href open the Zalo
      // app natively, which needs the original click gesture to work.
      if (message) {
        navigator.clipboard.writeText(message).catch(() => {});
        toast.success("Thông tin dịch vụ đã được sao chép", {
          description: "Paste vào Zalo để gửi cho tư vấn viên.",
          duration: 4000,
        });
      }
      trackContactClick({ channel: "zalo", leadType: "service", entityId: id, entityName: title });
    } else {
      e.preventDefault();
      setModalOpen(true);
      // Tracked inside ZaloContactModal's own actions instead.
    }
  };

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

          {price && (
            <p className="truncate type-price text-muted-foreground" title={price}>
              {price}
            </p>
          )}

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

      {/* Đặt lịch — ngoài card con. Cùng pattern mobile/desktop với
          BuyNowButton bên sản phẩm: mobile sao chép tin nhắn + để href
          navigate thật; desktop mở modal xem trước tin nhắn. Tin nhắn kèm
          đúng link riêng của dịch vụ này (/dich-vu/{slug}), không phải link
          /dich-vu chung — nhân viên nhận tin biết ngay khách hỏi dịch vụ nào. */}
      <div className="relative z-10 px-1 pb-1">
        <Button asChild className="w-full">
          <a href={zaloHref} target="_blank" rel="noopener noreferrer" onClick={handleBookClick}>
            Đặt lịch
          </a>
        </Button>
      </div>

      {message && (
        <ZaloContactModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          zaloHref={zaloHref}
          zaloPhone={zaloPhoneValue}
          phoneHref={phoneContact?.href}
          phoneNumber={phoneContact?.value}
          message={message}
          subtitle={title}
          leadType="service"
          entityId={id}
        />
      )}
    </div>
  );
}
