"use client";
import { CONTACT_TYPES } from "@/modules/contact/domain/constants";
import { EmailIcon, MapIcon, PhoneIcon } from "@/shared/components/ui/social-icons";
import { getFooterLogic } from "@/modules/settings/domain/footer";
import { cn } from "@/shared/lib/utils";
import Link from "next/link";
import React from "react";
import { PhoneConfirmation } from "./phone-confirmation";

interface FooterProps {
  branches?: any[];
  projects?: any[];
  pages?: any[];
  settings?: Record<string, string>;
  contacts?: any[];
  categories?: any[];
}

export function Footer({
  branches,
  projects,
  pages,
  settings,
  contacts,
  categories,
}: FooterProps) {
  const { phone, email, address, currentYear } = getFooterLogic(
    contacts,
    settings as any,
  );

  // --- STYLES ---
  const styles = {
    footer: "w-full bg-primary text-primary-foreground/60 py-20 px-6",
    container: "mx-auto max-w-7xl",
    logoCol: "mb-12",
    logo: "text-2xl font-bold tracking-tighter text-primary-foreground",
    logoDesc:
      "text-sm leading-relaxed max-w-sm mt-4 text-primary-foreground/40",
    grid: "grid grid-cols-2 lg:grid-cols-5 gap-y-12 gap-x-8",
    col: "flex flex-col gap-6",
    colTitle: "font-bold text-primary-foreground/80",
    nav: "flex flex-col gap-3.5",
    link: "text-sm text-primary-foreground/50 hover:text-primary-foreground transition-all duration-300",
    empty: "text-xs italic text-primary-foreground/20",
    bottom:
      "mt-20 pt-8 border-t border-primary-foreground/5 flex flex-col md:flex-row justify-between items-center gap-8",
    socials: "flex items-center gap-6",
    icon: "h-5 w-5 fill-current hover:text-primary-foreground transition-colors duration-300 flex items-center justify-center",
  };

  const getContactHref = (type: string, value: string) => {
    const clean = value.replace(/\s/g, "");
    if (value.startsWith("http")) return value;
    const hrefs: Record<string, string> = {
      phone: `tel:${clean}`,
      email: `mailto:${value}`,
      zalo: `https://zalo.me/${clean}`,
      messenger: `https://m.me/${value}`,
      facebook: `https://facebook.com/${value}`,
      tiktok: `https://tiktok.com/@${value}`,
      youtube: `https://youtube.com/${value}`,
    };
    return hrefs[type] || value;
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
          <NavCol title="Sản phẩm">
            {categories?.length ? (
              (() => {
                const parents = categories.filter((c) => !c.parent_id);
                return parents.map((parent) => (
                  <React.Fragment key={parent.slug}>
                    <Link
                      href={`/san-pham/${parent.slug}`}
                      className={cn(styles.link, "font-bold text-primary-foreground/70")}
                    >
                      {parent.name}
                    </Link>
                    {categories
                      .filter((child) => child.parent_id === parent.id)
                      .map((child) => (
                        <Link
                          key={child.slug}
                          href={`/san-pham/${child.slug}`}
                          className={cn(styles.link, "opacity-80")}
                        >
                          {child.name}
                        </Link>
                      ))}
                  </React.Fragment>
                ));
              })()
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
            {contacts?.map((c) => {
              const typeInfo = CONTACT_TYPES.find((t) => t.value === c.type);
              const href = getContactHref(c.type, c.value);
              const label = c.label || typeInfo?.label || c.type;
              const isExternal = !["phone", "email"].includes(c.type);


              const Icon = typeInfo?.icon;
              const content = (
                <div className="flex items-center gap-2.5">
                  {Icon && <Icon size={14} className="shrink-0 opacity-70" />}
                  <span className="truncate">{c.value}</span>
                </div>
              );

              if (c.type === "phone") {
                return (
                  <PhoneConfirmation
                    key={c.id}
                    phone={c.value.replace(/\s/g, "")}
                  >
                    <button
                      className={styles.link}
                    >
                      {content}
                    </button>
                  </PhoneConfirmation>
                );
              }

              return (
                <Link
                  key={c.id}
                  href={href}
                  target={isExternal ? "_blank" : undefined}
                  className={cn(styles.link, "truncate")}
                >
                  {content}
                </Link>
              );
            })}

            {!contacts?.some((c) => c.type === "phone") && phone && (
              <PhoneConfirmation phone={phone.replace(/\s/g, "")}>
                <button className={styles.link}>
                  <div className="flex items-center gap-2.5">
                    <PhoneIcon size={14} className="shrink-0 opacity-70" />
                    <span>{phone}</span>
                  </div>
                </button>
              </PhoneConfirmation>
            )}

            {!contacts?.some((c) => c.type === "email") && email && (
              <Link
                href={`mailto:${email}`}
                className={cn(styles.link, "truncate")}
              >
                <div className="flex items-center gap-2.5">
                  <EmailIcon size={14} className="shrink-0 opacity-70" />
                  <span className="truncate">{email}</span>
                </div>
              </Link>
            )}

            {address && (
              <Link
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                target="_blank"
                className={cn(styles.link, "leading-relaxed")}
              >
                <div className="flex items-start gap-2.5 pt-1">
                  <MapIcon size={14} className="shrink-0 opacity-70 mt-1" />
                  <span>{address}</span>
                </div>
              </Link>
            )}

            {!contacts?.length && !address && (
              <span className={styles.empty}>
                Đang cập nhật thông tin liên hệ
              </span>
            )}
          </NavCol>
        </div>

        {/* Bottom Section */}
        <div className={styles.bottom}>
          <p className="text-sm font-medium">
            © {currentYear} {settings?.company_name || "ELC"}
          </p>
          <div className={styles.socials}>
            {contacts
              ?.filter((c) =>
                [
                  "facebook",
                  "messenger",
                  "zalo",
                  "tiktok",
                  "youtube",
                  "phone",
                  "email",
                ].includes(c.type),
              )
              .map((c) => {
                const typeInfo = CONTACT_TYPES.find((t) => t.value === c.type);
                const Icon = typeInfo?.icon;
                const href = getContactHref(c.type, c.value);

                return (
                  <Link
                    key={c.id}
                    href={href}
                    target={
                      !["phone", "email"].includes(c.type)
                        ? "_blank"
                        : undefined
                    }
                    className={styles.icon}
                    title={typeInfo?.label}
                  >
                    {Icon ? (
                      <Icon size={20} />
                    ) : (
                      <span>{c.type[0].toUpperCase()}</span>
                    )}
                  </Link>
                );
              })}
          </div>
        </div>
      </div>
    </footer>
  );
}
