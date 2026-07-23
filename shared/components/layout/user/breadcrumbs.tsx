import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/shared/components/ui/breadcrumb";
import { BASE_URL, toJsonLdHtml } from "@/shared/lib/seo-schema";
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

// Single source for both the visual nav and its BreadcrumbList JSON-LD — a
// step without href (typically the active/current page) still gets a
// ListItem, just without an `item` URL, which schema.org allows for the
// last entry.
export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  const steps: BreadcrumbStep[] = [{ label: "Trang chủ", href: "/" }, ...items];
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: steps.map((step, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: step.label,
      ...(step.href ? { item: `${BASE_URL}${step.href}` } : {}),
    })),
  };

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <Breadcrumb>
        <BreadcrumbList className="flex-nowrap overflow-hidden gap-2 p-3 text-sm">
          <BreadcrumbItem className="shrink-0">
            <BreadcrumbLink href="/">Trang chủ</BreadcrumbLink>
          </BreadcrumbItem>

          <BreadcrumbSeparator className="shrink-0">/</BreadcrumbSeparator>

          {items.map((item, index) => {
            const isLast = index === items.length - 1;

            return (
              <React.Fragment key={index}>
                <BreadcrumbItem className={isLast ? "min-w-0 overflow-hidden" : "shrink-0"}>
                  {item.href && !isLast ? (
                    <BreadcrumbLink
                      href={item.href}
                      title={item.label}
                      className="truncate"
                    >
                      {item.label}
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage
                      title={item.label}
                      className="truncate block font-semibold"
                    >
                      {item.label}
                    </BreadcrumbPage>
                  )}
                </BreadcrumbItem>
                {!isLast && <BreadcrumbSeparator className="shrink-0">/</BreadcrumbSeparator>}
              </React.Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLdHtml(breadcrumbSchema) }}
      />
    </nav>
  );
}
