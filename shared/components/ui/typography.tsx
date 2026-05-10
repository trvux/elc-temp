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
        "scroll-m-20 text-2xl font-extrabold tracking-tight sm:text-3xl md:text-4xl lg:text-5xl",
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
        "scroll-m-20 text-xl font-semibold tracking-tight first:mt-0 sm:text-2xl md:text-3xl",
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
        "scroll-m-20 text-lg font-semibold tracking-tight sm:text-xl md:text-2xl",
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
        "scroll-m-20 text-base font-semibold tracking-tight sm:text-lg md:text-xl",
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
        "leading-7 not-first:mt-6 text-sm md:text-base lg:text-lg",
        className,
      )}
    >
      {children}
    </p>
  );
}

export function TypographyBlockquote({ children, className }: Typography) {
  return (
    <blockquote className={cn("mt-6 border-l-2 pl-6 italic", className)}>
      {children}
    </blockquote>
  );
}

export function TypographyTable({ children, className }: Typography) {
  return (
    <div className={cn("my-6 w-full overflow-y-auto", className)}>
      <table className="w-full border-collapse">{children}</table>
    </div>
  );
}

export function TableHead({ children }: { children: ReactNode }) {
  return (
    <th
      className={cn(
        "border px-4 py-2 text-left font-bold [&[align=center]]:text-center [&[align=right]]:text-right",
      )}
    >
      {children}
    </th>
  );
}

export function TableCell({ children }: { children: ReactNode }) {
  return (
    <td
      className={cn(
        "border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right",
      )}
    >
      {children}
    </td>
  );
}

export function TypographyList({ children, className }: Typography) {
  return (
    <ul className={cn("my-6 ml-6 list-disc [&>li]:mt-2", className)}>
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
    <p className={cn("text-base text-muted-foreground md:text-lg lg:text-xl", className)}>
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
    <small
      className={cn(
        "text-xs font-medium leading-none md:text-sm",
        className,
      )}
    >
      {children}
    </small>
  );
}

export function TypographyMuted({ children, className }: Typography) {
  return (
    <p className={cn("text-xs text-muted-foreground md:text-sm", className)}>
      {children}
    </p>
  );
}
