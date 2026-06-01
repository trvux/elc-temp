"use client";
import {
  FooterSettings,
  getFooterLogic,
} from "@/modules/settings/domain/footer";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import { ArrowRightIcon, MapPinIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useMemo } from "react";

import { BRAND_WEBSITES } from "@/modules/brand/domain";
import { Contact, getDisplayContacts } from "@/modules/contact/domain";
import { ContactLink } from "@/modules/contact/presentation/components/ContactLink";

export interface BrandFooter {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
}

export interface GroupCategoryFooter {
  id: string;
  name: string;
  slug: string;
}

export interface CategoryFooter {
  id: string;
  name: string;
  slug: string;
  groupId?: string | null;
}

export interface ProjectFooter {
  id: string;
  title: string;
  slug: string;
  serviceTypeId: string | null;
  serviceTypeName: string | null;
  serviceTypeSlug: string | null;
}

export interface BranchFooter {
  id: string;
  name: string;
  slug: string;
}

export interface PageFooter {
  id: string;
  title: string;
  slug: string;
}

export interface ServiceTypeFooter {
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
  serviceTypes?: ServiceTypeFooter[];
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
  serviceTypes = [],
  currentYear = 2026,
}: FooterProps) {
  const { address, currentYear: year } = getFooterLogic(
    contacts,
    settings as FooterSettings,
    currentYear
  );

  const displayContacts = useMemo(
    () => getDisplayContacts(contacts),
    [contacts],
  );

  // Build product section: each group becomes a column with its children below
  const productColumns = useMemo(() => {
    return groupCategories.map((group) => ({
      group,
      children: categoriesList.filter((cat) => cat.groupId === group.id),
    }));
  }, [groupCategories, categoriesList]);

  const borderColor = "border-muted-foreground/35";

  const DashedDivider = () => (
    <div className="absolute top-0 left-0 w-full h-px z-10 pointer-events-none">
      <div className="absolute left-1/2 h-px w-screen -translate-x-1/2">
        <hr className={`-mt-px w-full border-dashed ${borderColor}`} />
      </div>
    </div>
  );

  return (
    <footer className="w-full relative bg-background">
      {/* Top divider with diamonds matching GridSection */}
      <div className="absolute top-0 left-0 w-full h-px z-10 pointer-events-none">
        <div className="absolute left-1/2 h-px w-screen -translate-x-1/2">
          <hr className={`-mt-px w-full border-dashed ${borderColor}`} />
          <div className="relative mx-auto h-px w-full max-w-7xl px-4 md:px-6 lg:px-8">
            <span
              className={`border ${borderColor} bg-background absolute top-1/2 left-0 z-20 w-2.5 h-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[1px] hidden lg:block`}
            />
            <span
              className={`border ${borderColor} bg-background absolute top-1/2 right-0 z-20 w-2.5 h-2.5 translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[1px] hidden lg:block`}
            />
          </div>
        </div>
      </div>

      <div
        className={`max-w-7xl mx-auto px-4 md:px-6 lg:px-8 relative border-x border-dashed ${borderColor} py-10 md:py-16 lg:py-20`}
      >
        {/* ===== SECTION 1: Logo + Navigation ===== */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-y-12 gap-x-8 pb-16">
          {/* Logo & Description */}
          <div className="lg:col-span-2 flex flex-col gap-4 pr-0 lg:pr-8">
            <Link
              href="/"
              className="flex items-center gap-2 w-fit hover:opacity-80 transition-opacity"
            >
              <img
                src="/logo/logo.svg"
                alt="Điện máy ELC"
                loading="lazy"
                className="h-8 md:h-9 w-auto dark:brightness-0 dark:invert"
              />
            </Link>
            {settings?.company_short_desc && (
              <p className="text-sm leading-relaxed text-muted-foreground max-w-sm">
                {settings.company_short_desc}
              </p>
            )}

            {displayContacts.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                {displayContacts.map((contact) => (
                  <ContactLink
                    key={contact.id}
                    contact={contact}
                    showLabel={false}
                    showValue={false}
                    iconProps={{ size: 20, weight: "bold" }}
                    className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors flex items-center justify-center p-0 gap-0 cursor-pointer rounded-md bg-transparent"
                    iconClassName="size-4.5 flex items-center justify-center"
                    title={contact.label || contact.type}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Chi nhánh */}
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-foreground tracking-tight">
              Chi nhánh
            </h3>
            <nav className="flex flex-col gap-2.5">
              {branches.length ? (
                branches.map((b) => (
                  <Link
                    key={b.slug}
                    href={`/chi-nhanh/${b.slug}`}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                  >
                    {b.name}
                  </Link>
                ))
              ) : (
                <span className="text-xs italic text-muted-foreground/50">
                  Đang cập nhật
                </span>
              )}
            </nav>
          </div>

          {/* Thông tin */}
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-foreground tracking-tight">
              Thông tin
            </h3>
            <nav className="flex flex-col gap-2.5">
              {pages.length ? (
                pages.slice(0, 8).map((p) => (
                  <Link
                    key={p.slug}
                    href={`/${p.slug}`}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                  >
                    {p.title}
                  </Link>
                ))
              ) : (
                <span className="text-xs italic text-muted-foreground/50">
                  Đang cập nhật
                </span>
              )}
            </nav>
          </div>
        </div>

        {/* ===== BRAND SECTION: Thương hiệu đối tác ===== */}
        {brands.length > 0 && (
          <div className="relative pt-12 pb-16">
            <DashedDivider />

            <div className="flex flex-col gap-8">
              <div className="flex items-center justify-between">
                <h2 className="text-lg md:text-xl font-bold tracking-tight text-foreground font-heading">
                  Thương hiệu đối tác
                </h2>
                <Link
                  href="/san-pham"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-all flex items-center gap-1 group"
                >
                  <span className="hidden lg:block">
                    Xem tất cả sản phẩm thuộc thương hiệu
                  </span>
                  <span className="hidden lg:block transition-transform group-hover:translate-x-0.5">
                    <ArrowRightIcon />
                  </span>
                  <span className="lg:hidden">Xem tất cả</span>
                  <span className="lg:hidden transition-transform group-hover:translate-x-0.5">
                    <ArrowRightIcon />
                  </span>
                </Link>
              </div>

              {/* Grid of brand logos */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                {brands.map((brand) => {
                  const externalUrl =
                    BRAND_WEBSITES[brand.slug.toLowerCase().trim()];
                  const isExternal = !!externalUrl;
                  const url = externalUrl || `/san-pham?brand=${brand.slug}`;

                  return (
                    <Link
                      key={brand.id}
                      href={url}
                      target={isExternal ? "_blank" : undefined}
                      rel={isExternal ? "noopener noreferrer" : undefined}
                      className="group relative flex items-center justify-center p-4 rounded-xl transition-all duration-300 h-16 w-full overflow-hidden"
                      title={
                        isExternal
                          ? `Ghé thăm website chính thức của ${brand.name}`
                          : `Xem sản phẩm từ thương hiệu ${brand.name}`
                      }
                    >
                      {brand.logoUrl ? (
                        <img
                          src={brand.logoUrl}
                          alt={brand.name}
                          loading="lazy"
                          className="max-h-8 w-auto max-w-[85%] object-contain opacity-90"
                        />
                      ) : (
                        <span className="text-sm font-semibold text-muted-foreground group-hover:text-foreground transition-colors duration-300">
                          {brand.name}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ===== SECTION 2: Danh mục Sản phẩm (dynamic from DB groups) ===== */}
        {productColumns.length > 0 && (
          <div className="relative pt-12 pb-16">
            <DashedDivider />

            <div className="flex flex-col gap-8">
              <div className="flex items-center justify-between">
                <h2 className="text-lg md:text-xl font-bold tracking-tight text-foreground font-heading">
                  Danh mục Sản phẩm
                </h2>
                <Link
                  href="/san-pham"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-all flex items-center gap-1 group"
                >
                  <span>Xem tất cả</span>
                  <span className="transition-transform group-hover:translate-x-0.5">
                    →
                  </span>
                </Link>
              </div>

              <div
                className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${Math.min(productColumns.length, 4)} gap-x-8 gap-y-10`}
              >
                {productColumns.map(({ group, children }) => (
                  <div key={group.id} className="flex flex-col gap-3">
                    <Link
                      href={`/san-pham/${group.slug}`}
                      className="text-xs font-bold text-foreground tracking-wider hover:text-primary transition-colors"
                    >
                      <h3 className="text-sm font-semibold text-foreground tracking-tight">
                        {group.name}
                      </h3>
                    </Link>
                    <nav className="flex flex-col gap-2">
                      {children.length ? (
                        children.map((cat) => (
                          <Link
                            key={cat.slug}
                            href={`/san-pham/${cat.slug}`}
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                          >
                            {cat.name}
                          </Link>
                        ))
                      ) : (
                        <Link
                          href={`/san-pham/${group.slug}`}
                          className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                        >
                          Xem sản phẩm
                        </Link>
                      )}
                    </nav>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===== SECTION 3: Dự án nổi bật (grouped by service type) ===== */}
        {projects.length > 0 && (
          <div className="relative pt-12 pb-16">
            <DashedDivider />

            <div className="flex flex-col gap-8">
              <div className="flex items-center justify-between">
                <h2 className="text-lg md:text-xl font-bold tracking-tight text-foreground font-heading">
                  Dự án nổi bật
                </h2>
                <Link
                  href="/du-an"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-all flex items-center gap-1 group"
                >
                  <span>Xem tất cả</span>
                  <span className="transition-transform group-hover:translate-x-0.5">
                    <ArrowRightIcon />
                  </span>
                </Link>
              </div>

              {(() => {
                // Build columns: one per service type that has projects.
                // Service types order comes from serviceTypes prop (ordered by order_index).
                // Projects without a service type fall into a "Khác" column.
                const grouped = new Map<
                  string,
                  { name: string; slug: string; items: ProjectFooter[] }
                >();

                // Initialise buckets in order
                serviceTypes.forEach((st) => {
                  grouped.set(st.id, {
                    name: st.name,
                    slug: st.slug,
                    items: [],
                  });
                });

                projects.forEach((p) => {
                  const key = p.serviceTypeId ?? "__other__";
                  if (!grouped.has(key)) {
                    grouped.set(key, {
                      name: p.serviceTypeName ?? "Khác",
                      slug: p.serviceTypeSlug ?? "du-an",
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
                          href={`/du-an/${col.slug}`}
                          className="text-xs font-bold text-foreground tracking-wider hover:text-primary transition-colors"
                        >
                          <h3 className="text-sm font-semibold text-foreground tracking-tight">
                            {col.name}
                          </h3>
                        </Link>
                        <nav className="flex flex-col gap-2">
                          {col.items.map((p) => {
                            // Mirror ProjectCard displayTitle logic
                            const match =
                              p.title.match(/(?:tại|Tại|cho|Cho)\s+(.+)$/) ||
                              p.title.match(/-\s+([^-]+)$/);
                            const displayTitle =
                              match && match[1]
                                ? match[1].trim().charAt(0).toUpperCase() +
                                  match[1].trim().slice(1)
                                : p.title;

                            return (
                              <Link
                                key={p.id}
                                href={`/du-an/${p.slug}`}
                                className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 truncate block py-0.5"
                                title={p.title}
                              >
                                {displayTitle}
                              </Link>
                            );
                          })}
                        </nav>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* ===== SECTION 4: Copyright bar ===== */}
        <div className="relative pt-10">
          <DashedDivider />

          {/* Sử dụng grid-cols-1 cho mobile (xếp chồng) và grid-cols-10 cho màn hình lớn */}
          <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 items-start">
            {/* Cột 1: Chiếm 4 phần (4/10) */}
            <div className="lg:col-span-4 flex flex-col gap-2 text-center lg:text-left items-center lg:items-start">
              <p className="text-sm font-medium text-foreground">
                © {currentYear} {settings?.company_name || "Điện máy ELC"}
              </p>
            </div>

            {/* Cột 2: Chiếm 6 phần (6/10) */}
            <div className="lg:col-span-6 flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-2">
              <TooltipProvider>
                {displayContacts.map((contact) => (
                  <Tooltip key={contact.id}>
                    <TooltipTrigger asChild>
                      <ContactLink
                        contact={contact}
                        showLabel={true}
                        showValue={true}
                        iconProps={{ size: 14, weight: "bold" }}
                        iconClassName="shrink-0 text-muted-foreground"
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors py-1 flex items-center gap-1.5 cursor-pointer"
                      />
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p>{contact.label || contact.type}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}

                {address && (
                  <Link
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                    target="_blank"
                    className="text-xs text-muted-foreground hover:text-foreground leading-relaxed flex items-start gap-1.5 transition-colors"
                  >
                    <MapPinIcon
                      size={14}
                      weight="bold"
                      className="shrink-0 text-muted-foreground mt-0.5"
                    />
                    <span>Văn phòng: {address}</span>
                  </Link>
                )}
              </TooltipProvider>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
