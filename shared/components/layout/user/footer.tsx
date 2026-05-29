"use client";
import { getFooterLogic } from "@/modules/settings/domain/footer";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import { cn } from "@/shared/lib/utils";
import { MapPinIcon } from "@phosphor-icons/react";
import Link from "next/link";
import React, { useMemo } from "react";

import { Contact, getDisplayContacts } from "@/modules/contact/domain";
import { ContactLink } from "@/modules/contact/presentation/components/ContactLink";

export interface BrandFooter {
  id: string;
  name: string;
  slug: string;
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
}

interface FooterProps {
  branches?: any[];
  projects?: any[];
  pages?: any[];
  settings?: Record<string, string>;
  contacts?: Contact[];
  categories?: any[];
  brands?: BrandFooter[];
  groupCategories?: GroupCategoryFooter[];
  categoriesList?: CategoryFooter[];
}

export function Footer({
  branches,
  projects,
  pages,
  settings,
  contacts = [],
  categories,
  brands = [],
  groupCategories = [],
  categoriesList = [],
}: FooterProps) {
  const { address, currentYear } = getFooterLogic(contacts, settings as any);

  const displayContacts = useMemo(
    () => getDisplayContacts(contacts),
    [contacts],
  );

  // --- STYLES ---
  const styles = {
    footer: "w-full bg-foreground py-20 px-6",
    container: "mx-auto max-w-7xl",
    logoCol: "mb-12",
    logo: "text-2xl font-bold tracking-tighter text-primary-foreground",
    logoDesc:
      "text-sm leading-relaxed max-w-sm mt-4 text-primary-foreground/40",
    grid: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-y-12 gap-x-8",
    col: "flex flex-col gap-6",
    colTitle: "font-bold text-primary-foreground/80",
    nav: "flex flex-col gap-3.5",
    link: "text-sm text-primary-foreground/50 hover:text-primary-foreground transition-all duration-300 ",
    empty: "text-xs italic text-primary-foreground/20",
    bottom:
      "mt-20 pt-8 border-t border-primary-foreground/5 flex flex-col md:flex-row justify-between items-center gap-8",
    socials:
      "flex w-full md:w-auto items-center justify-evenly md:justify-end md:gap-4",
    icon: "p-2 bg-background/60 text-foreground hover:bg-background hover:text-foreground/80 rounded-sm transition-colors duration-300 flex items-center justify-center",
  };

  const NavCol = ({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) => (
    <div className={styles.col}>
      <h3 className={styles.colTitle}>{title}</h3>
      <nav className={styles.nav}>{children}</nav>
    </div>
  );

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        {/* Brand Section */}
        <div className={styles.logoCol}>
          <Link
            href="/"
            className="inline-block hover:opacity-80 transition-opacity"
          >
            <img
              src="/logo/logo.svg"
              alt="Điện máy ELC"
              className="h-12 w-auto brightness-0 invert"
            />
          </Link>
          {settings?.company_short_desc && (
            <p className={styles.logoDesc}>{settings.company_short_desc}</p>
          )}
        </div>

        {/* Navigation Grid */}
        <div className={styles.grid}>
          <NavCol title="Thương hiệu">
            {brands?.length ? (
              brands.map((b) => (
                <Link
                  key={b.slug}
                  href={`/san-pham/${b.slug}`}
                  className={styles.link}
                >
                  {b.name}
                </Link>
              ))
            ) : (
              <span className={styles.empty}>Đang cập nhật</span>
            )}
          </NavCol>

          <NavCol title="Nhóm sản phẩm">
            {groupCategories?.length ? (
              groupCategories.map((g) => (
                <Link
                  key={g.slug}
                  href={`/san-pham/${g.slug}`}
                  className={styles.link}
                >
                  {g.name}
                </Link>
              ))
            ) : (
              <span className={styles.empty}>Đang cập nhật</span>
            )}
          </NavCol>

          <NavCol title="Danh mục">
            {categoriesList?.length ? (
              categoriesList.map((c) => (
                <Link
                  key={c.slug}
                  href={`/san-pham/${c.slug}`}
                  className={styles.link}
                >
                  {c.name}
                </Link>
              ))
            ) : (
              <span className={styles.empty}>Đang cập nhật</span>
            )}
          </NavCol>

          <NavCol title="Dự án">
            {projects?.length ? (
              projects.slice(0, 8).map((p) => (
                <Link
                  key={p.id}
                  href={`/du-an/${p.slug}`}
                  className={styles.link}
                >
                  {p.title}
                </Link>
              ))
            ) : (
              <span className={styles.empty}>Đang cập nhật</span>
            )}
          </NavCol>

          <NavCol title="Chi nhánh">
            {branches?.length ? (
              branches.map((b) => (
                <Link
                  key={b.slug}
                  href={`/chi-nhanh/${b.slug}`}
                  className={styles.link}
                >
                  {b.name}
                </Link>
              ))
            ) : (
              <span className={styles.empty}>Đang cập nhật</span>
            )}
          </NavCol>

          <NavCol title="Thông tin">
            {pages?.length ? (
              pages.slice(0, 8).map((p) => (
                <Link key={p.slug} href={`/${p.slug}`} className={styles.link}>
                  {p.title}
                </Link>
              ))
            ) : (
              <span className={styles.empty}>Đang cập nhật</span>
            )}
          </NavCol>

          <NavCol title="Liên hệ">
            <TooltipProvider>
              {displayContacts.map((contact) => (
                <Tooltip key={contact.id}>
                  <TooltipTrigger asChild>
                    <ContactLink
                      contact={contact}
                      showLabel={false}
                      showValue
                      iconProps={{ size: 14, weight: "bold" }}
                      iconClassName="shrink-0 text-primary-foreground"
                      className={cn(styles.link, "truncate w-fit")}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{contact.label || contact.type}</p>
                  </TooltipContent>
                </Tooltip>
              ))}

              {address && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                      target="_blank"
                      className={cn(styles.link, "leading-relaxed w-fit")}
                    >
                      <div className="flex items-start gap-2.5 pt-1">
                        <MapPinIcon
                          size={14}
                          weight="bold"
                          className="shrink-0 text-primary-foreground mt-1"
                        />
                        <span>{address}</span>
                      </div>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>Địa chỉ văn phòng</p>
                  </TooltipContent>
                </Tooltip>
              )}

              {displayContacts.length === 0 && !address && (
                <span className={styles.empty}>
                  Đang cập nhật thông tin liên hệ
                </span>
              )}
            </TooltipProvider>
          </NavCol>
        </div>

        {/* Bottom Section */}
        <div className={styles.bottom}>
          <p className="text-sm font-medium">
            © {currentYear} {settings?.company_name || "ELC"}
          </p>
          <div className={styles.socials}>
            <TooltipProvider>
              {displayContacts.map((contact) => (
                <Tooltip key={contact.id}>
                  <TooltipTrigger asChild>
                    <ContactLink
                      contact={contact}
                      showLabel={false}
                      showValue={false}
                      iconProps={{ size: 20, weight: "bold" }}
                      className={styles.icon}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>{contact.label || contact.type}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </TooltipProvider>
          </div>
        </div>
      </div>
    </footer>
  );
}
