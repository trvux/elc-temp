import { ReactNode } from "react";

import { cn } from "@/shared/lib/utils";

interface Typography {
  children: ReactNode;
  className?: string;
}

export function TypographyH1({ children, className }: Typography) {
  return (
    <h1
      className={cn(
        // font-[590], not font-semibold (600) — Linear's own H1 computed
        // weight is exactly 590 (getComputedStyle, 2026-09-24), only
        // reachable as an arbitrary value on a true variable font. Was
        // font-semibold until app/layout.tsx switched --font-sans to
        // self-hosted "Inter Variable" (2026-09-25) specifically to make
        // this reachable — next/font/google's "Inter" technically also
        // exposed the full weight axis, but rendered ~9% wider than
        // Linear's self-hosted build for identical text/weight/spacing
        // (DOM-clone measurement), a font-file/version difference no
        // weight or CSS tuning could close.
        // md:text-5xl (48px), not md:text-4xl (36px) — measured against
        // Linear's own H1 at a flat 48px on desktop, by far the single
        // biggest gap of any heading level checked (H2/H3/body were all
        // within ~15%, this was 25%).
        // text-balance: Linear's own h1 computed style has
        // text-wrap: balance (confirmed via getComputedStyle) — makes a
        // multi-line heading break into visually even-length lines instead
        // of greedy-filling line 1 and dumping the leftover on line 2 (the
        // "(part II)" orphan-line look this was chasing pixel-width fixes
        // for, when it was really a line-breaking-algorithm difference).
        "scroll-m-20 font-heading text-3xl font-[590] tracking-tight md:text-5xl text-balance",
        className,
      )}
    >
      {children}
    </h1>
  );
}

export function TypographyH2({ children, className }: Typography) {
  return (
    <h2
      className={cn(
        "scroll-m-20 font-heading text-2xl font-semibold tracking-tight first:mt-0 md:text-3xl",
        className,
      )}
    >
      {children}
    </h2>
  );
}

export function TypographyH3({ children, className }: Typography) {
  return (
    <h3
      className={cn(
        "scroll-m-20 font-heading text-xl font-semibold tracking-tight md:text-2xl",
        className,
      )}
    >
      {children}
    </h3>
  );
}

export function TypographyH4({ children, className }: Typography) {
  return (
    <h4
      className={cn(
        "scroll-m-20 font-heading text-lg font-semibold tracking-tight md:text-xl",
        className,
      )}
    >
      {children}
    </h4>
  );
}

export function TypographyP({ children, className }: Typography) {
  return (
    <p
      className={cn(
        "leading-7 [&:not(:first-child)]:mt-6 text-sm md:text-base",
        className,
      )}
    >
      {children}
    </p>
  );
}

export function TypographyBlockquote({ children, className }: Typography) {
  return (
    <blockquote
      className={cn(
        "mt-6 border-l-2 pl-6 italic text-sm md:text-base",
        className,
      )}
    >
      {children}
    </blockquote>
  );
}

export function TypographyTable({ children, className }: Typography) {
  return (
    <div className={cn("my-6 w-full overflow-y-auto", className)}>
      <table className="w-full">{children}</table>
    </div>
  );
}

export function TableHead({ children, className }: Typography) {
  return (
    <th
      className={cn(
        "border px-4 py-2 text-left font-bold [&[align=center]]:text-center [&[align=right]]:text-right text-sm md:text-base",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function TableCell({ children, className }: Typography) {
  return (
    <td
      className={cn(
        "border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right text-sm md:text-base",
        className,
      )}
    >
      {children}
    </td>
  );
}

export function TypographyList({ children, className }: Typography) {
  return (
    <ul
      className={cn(
        "my-6 ml-6 list-disc [&>li]:mt-2 text-sm md:text-base",
        className,
      )}
    >
      {children}
    </ul>
  );
}

export function TypographyInlineCode({ children, className }: Typography) {
  return (
    <code
      className={cn(
        "relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold",
        className,
      )}
    >
      {children}
    </code>
  );
}

export function TypographyLead({ children, className }: Typography) {
  return (
    <p className={cn("text-lg text-muted-foreground md:text-xl", className)}>
      {children}
    </p>
  );
}

export function TypographyLarge({ children, className }: Typography) {
  return (
    <div className={cn("text-base font-semibold md:text-lg", className)}>
      {children}
    </div>
  );
}

export function TypographySmall({ children, className }: Typography) {
  return (
    <small className={cn("text-sm font-medium leading-none", className)}>
      {children}
    </small>
  );
}

export function TypographyMuted({ children, className }: Typography) {
  return (
    <p className={cn("text-sm text-muted-foreground", className)}>
      {children}
    </p>
  );
}
