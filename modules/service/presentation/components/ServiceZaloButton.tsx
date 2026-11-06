"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/button";
import { trackContactClick } from "@/modules/inquiry";
import type { CtaPlacement, TrackingContext } from "@/modules/inquiry/domain";
import { ZaloContactModal } from "@/shared/components/organisms/layout/user/zalo-contact-modal";
import { buildZaloServiceMessage, isMobileDevice } from "@/shared/lib/zalo-message";
import { useContacts } from "@/shared/providers/contact-provider";
import { SERVICE_LINES, type ServiceLine } from "../../domain/line";

interface ServiceZaloButtonProps {
  id: string;
  title: string;
  slug: string;
  line: ServiceLine;
  briefPrompts: string[];
  // Which button this is, for the qualify_lead event (see CtaPlacement).
  placement: CtaPlacement;
  // Answers already collected (the lead form's brief step): put into the message.
  answers?: Record<string, string>;
  // Overrides the line's default button label.
  label?: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
  className?: string;
}

// The one call-to-action every service has: it starts a Zalo conversation.
// Zalo cannot be opened with a message, so on mobile the message is copied and
// the app opens (paste to send); on desktop a modal shows the message to copy.
// The message carries the blanks staff need to quote (brief prompts).
export function ServiceZaloButton({
  id,
  title,
  slug,
  line,
  briefPrompts,
  placement,
  answers,
  label,
  variant = "default",
  size,
  className,
}: ServiceZaloButtonProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const contacts = useContacts();
  const zaloContact =
    contacts.find((c) => c.type === "zalo" && c.isActive) || contacts.find((c) => c.type === "zalo");
  const phoneContact =
    contacts.find((c) => c.type === "phone" && c.isActive) || contacts.find((c) => c.type === "phone");
  // Same hardcoded fallback the old card used: the button must never disappear
  // just because contacts have not loaded or are not configured.
  const zaloHref = zaloContact?.href ?? "https://zalo.me/0789978898";
  const zaloPhoneValue = zaloContact?.value ?? "0789978898";

  const info = SERVICE_LINES[line];
  const trackingContext: TrackingContext = { serviceSlug: slug, serviceLine: line, ctaPlacement: placement };
  const message = buildZaloServiceMessage({
    serviceName: title,
    serviceSlug: slug,
    opener: info.messageOpener,
    briefPrompts,
    answers,
  });

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (isMobileDevice()) {
      // Copy fire-and-forget, no preventDefault: the href must open the Zalo
      // app natively, which needs the original click gesture.
      navigator.clipboard.writeText(message).catch(() => {});
      toast.success("Nội dung đã được sao chép", {
        description: "Dán vào Zalo để gửi cho tư vấn viên.",
        duration: 4000,
      });
      trackContactClick({ channel: "zalo", leadType: "service", entityId: id, entityName: title, context: trackingContext });
    } else {
      e.preventDefault();
      setModalOpen(true);
      // Tracked inside ZaloContactModal's own actions instead.
    }
  };

  return (
    <>
      <Button asChild variant={variant} size={size} className={className}>
        <a href={zaloHref} target="_blank" rel="noopener noreferrer" onClick={handleClick}>
          {label ?? info.ctaLabel}
        </a>
      </Button>
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
        trackingContext={trackingContext}
      />
    </>
  );
}
