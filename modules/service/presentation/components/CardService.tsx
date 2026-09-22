"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/shared/components/ui/badge";
import { Button, buttonVariants } from "@/shared/components/ui/button";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
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
}

// Tạm thời tắt việc click vào card để vào trang chi tiết dịch vụ —
// khách chỉ dừng ở trang /dich-vu và bấm "Đặt lịch". Đổi lại thành `true`
// khi cần bật lại trang chi tiết (mũi tên truy cập sẽ hiện lại theo).
const ENABLE_DETAIL_LINK = false;

export function CardService({
  id,
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
      trackContactClick({ channel: "zalo", leadType: "service", entityId: id });
    } else {
      e.preventDefault();
      setModalOpen(true);
      // Tracked inside ZaloContactModal's own actions instead.
    }
  };

  return (
    <div className="rounded-2xl bg-muted/30 p-1 flex h-full flex-col gap-1.5 border border-border shadow-xs">
      {/* Card con: ảnh + tên + badge + mô tả + giá dịch vụ */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-border bg-background">
        <div className="relative aspect-video w-full overflow-hidden">
          <Image
            src={imageSrc}
            alt={title || ""}
            fill
            sizes="(max-width: 768px) 100vw, 384px"
            className="object-cover"
          />
        </div>

        <div className="flex flex-1 flex-col gap-2 p-3">
          {/* Tên dịch vụ (trái) + mũi tên truy cập (phải, chỉ hiện khi bật lại trang chi tiết) */}
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-heading text-lg font-semibold leading-tight line-clamp-1 min-w-0">
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

          {price && (
            <p className="truncate text-base font-medium text-muted-foreground" title={price}>
              {price}
            </p>
          )}

          {description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
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
      <div className="px-1 pb-1">
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
