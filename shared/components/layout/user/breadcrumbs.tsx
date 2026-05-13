"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/shared/components/ui/breadcrumb";
import { cn } from "@/shared/lib/utils";
import Link from "next/link";
import React from "react";

export interface BreadcrumbStep {
  label: string;
  href?: string;
  active?: boolean;
}

interface BreadcrumbsProps {
  items: BreadcrumbStep[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://dienmayelc.com.vn";

  // Generate JSON-LD for Google SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Trang chủ",
        item: `${baseUrl}`,
      },
      ...items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 2,
        name: item.label,
        item: item.href
          ? item.href.startsWith("http")
            ? item.href
            : `${baseUrl}${item.href}`
          : undefined,
      })),
    ],
  };

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("py-2 text-xs md:text-sm overflow-hidden", className)}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Breadcrumb>
        <BreadcrumbList className="flex-nowrap overflow-x-auto no-scrollbar pb-1">
          <BreadcrumbItem className="shrink-0">
            <BreadcrumbLink asChild>
              <Link
                href="/"
                className="flex items-center gap-1 hover:text-primary transition-colors"
              >
                Trang chủ
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>

          <BreadcrumbSeparator className="shrink-0 opacity-40">
            <span>/</span>
          </BreadcrumbSeparator>

          {items.map((item, index) => {
            const isLast = index === items.length - 1;

            return (
              <React.Fragment key={index}>
                <BreadcrumbItem
                  className={cn(
                    "shrink-0 max-w-[120px] sm:max-w-[200px] md:max-w-none",
                    isLast && "max-w-[150px] sm:max-w-none",
                  )}
                >
                  {item.href && !isLast ? (
                    <BreadcrumbLink asChild>
                      <Link
                        href={item.href}
                        className="truncate block text-muted-foreground/80 hover:text-primary transition-colors font-medium"
                        title={item.label}
                      >
                        {item.label}
                      </Link>
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage
                      className={cn(
                        "font-bold text-foreground truncate block",
                        isLast && "opacity-100",
                      )}
                      title={item.label}
                    >
                      {item.label}
                    </BreadcrumbPage>
                  )}
                </BreadcrumbItem>
                {!isLast && (
                  <BreadcrumbSeparator className="shrink-0 opacity-40">
                    <span>/</span>
                  </BreadcrumbSeparator>
                )}
              </React.Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </nav>
  );
}
