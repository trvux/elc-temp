"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/shared/components/ui/breadcrumb";
import { usePathname } from "next/navigation";
import React, { useEffect } from "react";

export interface BreadcrumbStep {
  label: string;
  href?: string;
  active?: boolean;
}

interface BreadcrumbsProps {
  items: BreadcrumbStep[];
  className?: string;
  disableJsonLd?: boolean;
}

export function Breadcrumbs({ items, className, disableJsonLd }: BreadcrumbsProps) {
  const pathname = usePathname();
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://dienmayelc.com.vn";

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
          : `${baseUrl}${pathname}`,
      })),
    ],
  };

  // Inject JSON-LD imperatively to avoid React's script-in-client-component warning.
  // Scripts mutated via the DOM are outside React's render tree and never trigger the warning.
  useEffect(() => {
    if (disableJsonLd) return;

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(jsonLd);
    script.setAttribute("data-breadcrumb-jsonld", "true");
    document.head.appendChild(script);

    return () => {
      script.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, JSON.stringify(items)]);

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
