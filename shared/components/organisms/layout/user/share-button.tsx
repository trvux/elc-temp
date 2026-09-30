"use client";

import { useState } from "react";
import { CheckIcon, LinkSimpleIcon, ShareNetworkIcon } from "@phosphor-icons/react";

import { Button } from "@/shared/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import { ContactIcon } from "@/modules/contact/presentation/utils";
import { cn } from "@/shared/lib/utils";
import { toast } from "sonner";

interface ShareButtonProps {
  // Absolute URL (BASE_URL + path) — required so a shared link/native share
  // sheet/Facebook sharer all resolve correctly regardless of where the
  // share was triggered from.
  url: string;
  title: string;
  variant?: "icon" | "button";
  size?: "icon-xs" | "icon-sm" | "icon" | "icon-lg";
  className?: string;
}

// Same icon-overlay pattern as WishlistButton (ProductImageGallery,
// ServiceDetailModule hero). On mobile, the OS native share sheet
// (navigator.share) already covers every app the user has installed, so the
// popover fallback below only renders when that API is unavailable
// (desktop browsers without navigator.share support).
export function ShareButton({ url, title, variant = "icon", size = "icon-sm", className }: ShareButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleTriggerClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // AbortError when the user dismisses the native sheet - not a failure.
      }
      return;
    }

    setOpen(true);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Đã sao chép liên kết");
    setTimeout(() => setCopied(false), 2000);
  };

  const icon = <ShareNetworkIcon />;

  const trigger =
    variant === "button" ? (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={cn("flex-1", className)}
        onClick={handleTriggerClick}
      >
        {icon}
        Chia sẻ
      </Button>
    ) : (
      <Button
        type="button"
        variant="secondary"
        size={size}
        className={cn("rounded-full", className)}
        aria-label="Chia sẻ"
        onClick={handleTriggerClick}
      >
        {icon}
      </Button>
    );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        className="w-52 p-1.5"
        align="end"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-0.5">
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm hover:bg-accent transition-colors"
          >
            <ContactIcon type="facebook" size={16} weight="fill" className="text-[#1877F2]" />
            Facebook
          </a>
          <a
            href={`https://zalo.me/share?u=${encodeURIComponent(url)}&d=${encodeURIComponent(title)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm hover:bg-accent transition-colors"
          >
            <ContactIcon type="zalo" size={16} className="text-[#0068FF]" />
            Zalo
          </a>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm hover:bg-accent transition-colors text-left"
          >
            {copied ? (
              <CheckIcon size={16} className="text-green-600" />
            ) : (
              <LinkSimpleIcon size={16} />
            )}
            {copied ? "Đã sao chép" : "Sao chép liên kết"}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
