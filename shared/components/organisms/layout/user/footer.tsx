"use client";
import { getFooterLogic } from "@/modules/settings/domain/footer";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import { ArrowRightIcon, MapPinIcon } from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";

import { Contact, getDisplayContacts } from "@/modules/contact/domain";
import { ContactLink } from "@/modules/contact/presentation/components/ContactLink";
import { sortByOrderIndex } from "@/shared/lib/helpers";
import { groupCategoriesByGroup } from "@/shared/lib/group-categories";

interface BrandFooter {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
}

interface GroupCategoryFooter {
  id: string;
  name: string;
  slug: string;
}

interface CategoryFooter {
  id: string;
  name: string;
  slug: string;
  groupId?: string | null;
}

export interface ProjectFooter {
  id: string;
  title: string;
  slug: string;
  projectTypeId: string | null;
  projectTypeName: string | null;
  projectTypeSlug: string | null;
}

interface BranchFooter {
  id: string;
  name: string;
  slug: string;
  address?: string;
}

interface PageFooter {
  id: string;
  title: string;
  slug: string;
}

interface ProjectTypeFooter {
  id: string;
  name: string;
  slug: string;
}

interface FooterProps {
  branches?: BranchFooter[];
  projects?: ProjectFooter[];
  pages?: PageFooter[];
  settings?: Record<string, string>;
  contacts?: Contact[];
  categories?: CategoryFooter[];
  brands?: BrandFooter[];
  groupCategories?: GroupCategoryFooter[];
  categoriesList?: CategoryFooter[];
  projectTypes?: ProjectTypeFooter[];
  currentYear?: number;
}

export function Footer({
  branches = [],
  projects = [],
  pages = [],
  settings,
  contacts = [],
  brands = [],
  groupCategories = [],
  categoriesList = [],
  projectTypes = [],
  currentYear = 2026,
}: FooterProps) {
  const { address } = getFooterLogic(
    contacts,
    currentYear,
    branches as Array<{ address: string }>,
  );

  // No manual useMemo here — React Compiler auto-memoizes this, and a
  // manual dependency array on a prop it can't prove is stable is exactly
  // what "Existing memoization could not be preserved" warns about.
  const displayContacts = getDisplayContacts(contacts);

  // Build product section: each group becomes a column with its children below
  const productColumns = useMemo(
    () => groupCategoriesByGroup(groupCategories, categoriesList),
    [groupCategories, categoriesList],
  );

  return (
    <footer className="w-full relative bg-background">
      {/* Footer is repeated on every page, so its link groups are labelled
          <nav>s with plain <p> titles instead of h2/h3: headings here would
          sit in every page's outline right after the real content. No
          divider line/diamond (see grid-section.tsx's removal comment,
          2026-09-24): sections separate by spacing alone. */}
      <div className="mx-auto h-full w-full max-w-350 min-[112.5rem]:max-w-384 px-4 md:px-6 lg:px-12 relative py-10 md:py-16 lg:py-20">
        {/* ===== SECTION 1: Logo + Navigation ===== */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-y-12 gap-x-8 pb-16">
          {/* Logo & Description */}
          <div className="lg:col-span-2 flex flex-col gap-4 pr-0 lg:pr-8">
            <Link
              href="/"
              className="flex items-center gap-2 w-fit hover:opacity-80 transition-opacity"
            >
              <Image
                src="/logo/logo.svg?v=footer"
                alt="Điện máy ELC"
                width={36}
                height={36}
                loading="lazy"
                style={{ width: "auto" }}
                className="h-8 md:h-9 w-auto"
              />
            </Link>
            {settings?.company_short_desc && (
              <p className="type-body-sm text-muted-foreground max-w-sm">
                {settings.company_short_desc}
              </p>
            )}

            {displayContacts.length > 0 && (
              <ul aria-label="Liên hệ nhanh" className="flex flex-wrap items-center gap-1.5 mt-2">
                {displayContacts.map((contact) => (
                  <li key={contact.id}>
                    <ContactLink
                      contact={contact}
                      showLabel={false}
                      showValue={false}
                      iconProps={{ size: 20, weight: "bold" }}
                      className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors flex items-center justify-center p-0 gap-0 cursor-pointer rounded-md bg-transparent"
                      iconClassName="size-4.5 flex items-center justify-center"
                      aria-label={contact.label || contact.type}
                      title={contact.label || contact.type}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Cơ sở hạ tầng */}
          <nav aria-labelledby="footer-infra-title" className="flex flex-col gap-4">
            <p id="footer-infra-title" className="type-label text-foreground">
              Cơ sở hạ tầng
            </p>
            <ul className="flex flex-col gap-2.5">
              {branches.length ? (
                sortByOrderIndex(branches).map((b) => (
                  <li key={b.slug}>
                    <Link
                      href={`/thong-tin/${b.slug}`}
                      className="type-body-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                    >
                      {b.name}
                    </Link>
                  </li>
                ))
              ) : (
                <li>
                  <span className="type-legal italic text-muted-foreground/50">
                    Đang cập nhật
                  </span>
                </li>
              )}
            </ul>
          </nav>

          {/* Thông tin */}
          <nav aria-labelledby="footer-info-title" className="flex flex-col gap-4">
            <p id="footer-info-title" className="type-label text-foreground">
              Thông tin
            </p>
            <ul className="flex flex-col gap-2.5">
              {pages.length ? (
                sortByOrderIndex(pages).slice(0, 8).map((p) => (
                  <li key={p.slug}>
                    <Link
                      href={`/${p.slug}`}
                      className="type-body-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                    >
                      {p.title}
                    </Link>
                  </li>
                ))
              ) : (
                <li>
                  <span className="type-legal italic text-muted-foreground/50">
                    Đang cập nhật
                  </span>
                </li>
              )}
            </ul>
          </nav>
        </div>

        {/* ===== BRAND SECTION: Thương hiệu đối tác ===== */}
        {brands.length > 0 && (
          <nav aria-labelledby="footer-brands-title" className="relative pt-12 pb-16">
            <div className="flex flex-col gap-8">
              <div className="flex items-center justify-between">
                <p id="footer-brands-title" className="type-heading text-foreground">
                  Thương hiệu đối tác
                </p>
                <Link
                  href="/san-pham"
                  className="type-caption text-muted-foreground hover:text-foreground transition-all flex items-center gap-1 group"
                >
                  <span className="hidden lg:block">
                    Xem tất cả sản phẩm thuộc thương hiệu
                  </span>
                  <span aria-hidden="true" className="hidden lg:block transition-transform group-hover:translate-x-0.5">
                    <ArrowRightIcon />
                  </span>
                  <span className="lg:hidden">Xem tất cả</span>
                  <span aria-hidden="true" className="lg:hidden transition-transform group-hover:translate-x-0.5">
                    <ArrowRightIcon />
                  </span>
                </Link>
              </div>

              {/* Grid of brand logos */}
              <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                {brands.map((brand) => {
                  const url = `/san-pham?brands=${brand.slug.toLowerCase().trim()}`;

                  return (
                    <li key={brand.id}>
                      <Link
                        href={url}
                        className="group relative flex items-center justify-center p-4 rounded-xl transition-all duration-300 h-16 w-full overflow-hidden"
                        title={`Xem sản phẩm từ thương hiệu ${brand.name}`}
                      >
                        {brand.logoUrl ? (
                          <div className="relative h-8 w-full max-w-[85%]">
                            <Image
                              src={brand.logoUrl}
                              alt={brand.name}
                              fill
                              loading="lazy"
                              sizes="120px"
                              className="object-contain opacity-90"
                            />
                          </div>
                        ) : (
                          <span className="type-label text-muted-foreground group-hover:text-foreground transition-colors duration-300">
                            {brand.name}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </nav>
        )}

        {/* ===== SECTION 2: Danh mục Sản phẩm (dynamic from DB groups) ===== */}
        {productColumns.length > 0 && (
          <nav aria-labelledby="footer-products-title" className="relative pt-12 pb-16">
            <div className="flex flex-col gap-8">
              <div className="flex items-center justify-between">
                <p id="footer-products-title" className="type-heading text-foreground">
                  Danh mục Sản phẩm
                </p>
                <Link
                  href="/san-pham"
                  className="type-caption text-muted-foreground hover:text-foreground transition-all flex items-center gap-1 group"
                >
                  <span>Xem tất cả</span>
                  <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">
                    <ArrowRightIcon />
                  </span>
                </Link>
              </div>

              <div
                className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${Math.min(productColumns.length, 4)} gap-x-8 gap-y-10`}
              >
                {productColumns.map(({ group, categories: children }) => (
                  <div key={group.id} className="flex flex-col gap-3">
                    <Link
                      id={`footer-group-${group.id}`}
                      href={`/san-pham/${group.slug}`}
                      className="type-label text-foreground hover:text-primary transition-colors"
                    >
                      {group.name}
                    </Link>
                    <ul aria-labelledby={`footer-group-${group.id}`} className="flex flex-col gap-2">
                      {children.length ? (
                        children.map((cat) => (
                          <li key={cat.slug}>
                            <Link
                              href={`/san-pham/${cat.slug}`}
                              className="type-body-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                            >
                              {cat.name}
                            </Link>
                          </li>
                        ))
                      ) : (
                        <li>
                          <Link
                            href={`/san-pham/${group.slug}`}
                            className="type-body-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                          >
                            Xem sản phẩm
                          </Link>
                        </li>
                      )}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </nav>
        )}

        {/* ===== SECTION 3: Dự án nổi bật (grouped by service type) ===== */}
        {projects.length > 0 && (
          <nav aria-labelledby="footer-projects-title" className="relative pt-12 pb-16">
            <div className="flex flex-col gap-8">
              <div className="flex items-center justify-between">
                <p id="footer-projects-title" className="type-heading text-foreground">
                  Dự án nổi bật
                </p>
                <Link
                  href="/du-an"
                  className="type-caption text-muted-foreground hover:text-foreground transition-all flex items-center gap-1 group"
                >
                  <span>Xem tất cả</span>
                  <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">
                    <ArrowRightIcon />
                  </span>
                </Link>
              </div>

              {(() => {
                const grouped = new Map<
                  string,
                  { name: string; slug: string; items: ProjectFooter[] }
                >();

                projectTypes.forEach((st) => {
                  grouped.set(st.id, {
                    name: st.name,
                    slug: st.slug,
                    items: [],
                  });
                });

                projects.forEach((p) => {
                  const key = p.projectTypeId ?? "__other__";
                  if (!grouped.has(key)) {
                    grouped.set(key, {
                      name: p.projectTypeName ?? "Khác",
                      slug: p.projectTypeSlug ?? "du-an",
                      items: [],
                    });
                  }
                  const bucket = grouped.get(key)!;
                  if (bucket.items.length < 8) {
                    bucket.items.push(p);
                  }
                });

                const columns = Array.from(grouped.values()).filter(
                  (col) => col.items.length > 0,
                );

                if (columns.length === 0) return null;

                return (
                  <div
                    className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${Math.min(columns.length, 4)} gap-x-8 gap-y-10`}
                  >
                    {columns.map((col) => (
                      <div key={col.slug} className="flex flex-col gap-3">
                        <Link
                          id={`footer-project-${col.slug}`}
                          href={`/du-an/${col.slug}`}
                          className="type-label text-foreground hover:text-primary transition-colors"
                        >
                          {col.name}
                        </Link>
                        <ul aria-labelledby={`footer-project-${col.slug}`} className="flex flex-col gap-2">
                          {col.items.map((p) => {
                            const match =
                              p.title.match(/(?:tại|Tại|cho|Cho)\s+(.+)$/) ||
                              p.title.match(/-\s+([^-]+)$/);
                            const displayTitle =
                              match && match[1]
                                ? match[1].trim().charAt(0).toUpperCase() +
                                  match[1].trim().slice(1)
                                : p.title;

                            return (
                              <li key={p.id}>
                                <Link
                                  href={`/du-an/${p.slug}`}
                                  className="type-body-sm text-muted-foreground hover:text-foreground transition-colors duration-200 truncate block py-0.5"
                                  title={p.title}
                                >
                                  {displayTitle}
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </nav>
        )}

        {/* ===== SECTION 4: Copyright bar ===== */}
        <div className="relative pt-10">
          <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 items-start">
            <div className="lg:col-span-4 flex flex-col gap-2 text-center lg:text-left items-center lg:items-start">
              <p className="type-caption text-foreground">
                © {currentYear} {settings?.company_name || "Điện máy ELC"}
              </p>
              <button
                type="button"
                onClick={() => window.dispatchEvent(new Event("elc:open-consent-banner"))}
                className="type-legal text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
              >
                Cài đặt cookie
              </button>
            </div>

            <ul className="lg:col-span-6 flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-2">
              <TooltipProvider>
                {displayContacts.map((contact) => (
                  <li key={contact.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <ContactLink
                          contact={contact}
                          showLabel={true}
                          showValue={true}
                          iconProps={{ size: 14, weight: "bold" }}
                          iconClassName="shrink-0 text-muted-foreground"
                          className="type-legal text-muted-foreground hover:text-foreground transition-colors py-1 flex items-center gap-1.5 cursor-pointer"
                        />
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p>{contact.label || contact.type}</p>
                      </TooltipContent>
                    </Tooltip>
                  </li>
                ))}

                {address && (
                  <li>
                    <Link
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="type-legal text-muted-foreground hover:text-foreground flex items-start gap-1.5 transition-colors"
                    >
                      <MapPinIcon
                        aria-hidden="true"
                        size={14}
                        weight="bold"
                        className="shrink-0 text-muted-foreground mt-0.5"
                      />
                      <span>Văn phòng: {address}</span>
                    </Link>
                  </li>
                )}
              </TooltipProvider>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
