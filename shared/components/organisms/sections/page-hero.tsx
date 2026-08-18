import type { ReactNode } from "react";

import { TypographyH1, TypographyLead } from "@/shared/components/ui/typography";
import { cn } from "@/shared/lib/utils";

interface PageHeroProps {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
}

// Shared centered banner for content-hub pages (tin tuc, dich vu, thong tin,
// du an...) — the plain-text counterpart to the homepage's animated
// FluidBackground hero. Every hub page used to hand-roll its own
// near-identical `<header>` block; this replaces all of them with one
// definition so page-level markup only supplies the copy.
export function PageHero({
  eyebrow,
  title,
  description,
  children,
  className,
  titleClassName,
  descriptionClassName,
}: PageHeroProps) {
  return (
    <header
      className={cn(
        "mx-auto flex w-full max-w-2xl flex-col items-center gap-6 text-center",
        className,
      )}
    >
      {eyebrow && (
        <span className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
          {eyebrow}
        </span>
      )}
      <TypographyH1 className={titleClassName}>{title}</TypographyH1>
      {description && (
        <TypographyLead className={descriptionClassName}>{description}</TypographyLead>
      )}
      {children}
    </header>
  );
}
