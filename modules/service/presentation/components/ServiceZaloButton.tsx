"use client";

import { toast } from "sonner";
import { Button } from "@/shared/components/ui/button";
import { trackContactClick } from "@/modules/inquiry";
import type { CtaPlacement, TrackingContext } from "@/modules/inquiry/domain";
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
  // The product the visitor is looking at, when the button sits on a product page.
  product?: { name: string; slug: string };
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
  product,
  label,
  variant = "default",
  size,
  className,
}: ServiceZaloButtonProps) {
  const contacts = useContacts();
  const zaloContact =
    contacts.find((c) => c.type === "zalo" && c.isActive) || contacts.find((c) => c.type === "zalo");
  // just because contacts have not loaded or are not configured.
  const zaloHref = zaloContact?.href ?? "https://zalo.me/0789978898";

  const info = SERVICE_LINES[line];
  const trackingContext: TrackingContext = { serviceSlug: slug, serviceLine: line, ctaPlacement: placement };
  const compose = (given?: Record<string, string>) =>
    buildZaloServiceMessage({
      serviceName: title,
      serviceSlug: slug,
      opener: info.messageOpener,
      briefPrompts,
      answers: given,
      product,
    });
  // What a phone copies straight away: the answers already collected (lead form), if any.
  const message = compose(answers);

  // One click on every device: copy the message, open Zalo (the href does it, in a
  // new tab), and say what to do next. No popup in between. Copy is fire-and-forget
  // with no preventDefault: the link must open from the original click gesture.
  const handleClick = () => {
    navigator.clipboard.writeText(message).catch(() => {});
    toast.success("Đã sao chép nội dung", {
      description: isMobileDevice()
        ? "Dán vào Zalo để gửi cho tư vấn viên."
        : "Dán (Ctrl+V) vào cuộc trò chuyện Zalo rồi gửi.",
      duration: 5000,
    });
    trackContactClick({ channel: "zalo", leadType: "service", entityId: id, entityName: title, context: trackingContext });
  };

  return (
    <Button asChild variant={variant} size={size} className={className}>
      <a href={zaloHref} target="_blank" rel="noopener noreferrer" onClick={handleClick}>
        {label ?? info.ctaLabel}
      </a>
    </Button>
  );
}
