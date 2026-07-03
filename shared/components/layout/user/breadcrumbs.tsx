import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/shared/components/ui/breadcrumb";
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

// Visual nav only — BreadcrumbList JSON-LD is rendered server-side via
// generateBreadcrumbSchema (shared/lib/seo-utils.ts) next to the other page schemas,
// not from this component. See that function's doc comment for why.
export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
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
    </nav>
  );
}
