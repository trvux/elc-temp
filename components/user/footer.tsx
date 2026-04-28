import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { PhoneConfirmation } from "./phone-confirmation";

interface FooterProps {
  branches?: any[];
  projects?: any[];
  pages?: any[];
  settings?: Record<string, string>;
  contacts?: any[];
}

export function Footer({
  branches,
  projects,
  pages,
  settings,
  contacts,
}: FooterProps) {
  const currentYear = new Date().getFullYear();

  // --- LOGIC ---
  const findContact = (type: string) =>
    contacts?.find((c) => c.type === type)?.value;
  const phone =
    findContact("phone") || settings?.company_phone || "0909 411 633";
  const email =
    findContact("email") || settings?.company_email || "contact@elc.com";
  const address =
    settings?.company_address ||
    "06 Dương Quảng Hàm, Phường An Nhơn, Gò Vấp, HCM";
  const cleanPhone = phone.replace(/\s/g, "");

  const getSocialUrl = (type: "facebook" | "messenger" | "zalo") => {
    const val = findContact(type) || settings?.[`${type}_url`];
    if (!val || val === "#") {
      return type === "zalo" ? `https://zalo.me/${cleanPhone}` : "#";
    }
    if (val.startsWith("http")) return val;
    if (type === "zalo") return `https://zalo.me/${val}`;
    return type === "facebook"
      ? `https://facebook.com/${val}`
      : `https://m.me/${val}`;
  };

  // --- STYLES ---
  const styles = {
    footer: "w-full bg-primary text-primary-foreground/60 py-20 px-6",
    container: "mx-auto max-w-7xl",
    logoCol: "mb-12",
    logo: "text-2xl font-bold tracking-tighter text-primary-foreground",
    logoDesc:
      "text-sm leading-relaxed max-w-sm mt-4 text-primary-foreground/40",
    grid: "grid grid-cols-2 lg:grid-cols-4 gap-y-12 gap-x-8",
    col: "flex flex-col gap-6",
    colTitle:
      "text-[11px] font-bold text-primary-foreground/80 uppercase tracking-[0.2em]",
    nav: "flex flex-col gap-3.5",
    link: "text-sm text-primary-foreground/50 hover:text-primary-foreground transition-all duration-300",
    empty: "text-xs italic text-primary-foreground/20",
    bottom:
      "mt-20 pt-8 border-t border-primary-foreground/5 flex flex-col md:flex-row justify-between items-center gap-8",
    socials: "flex items-center gap-6",
    icon: "h-5 w-5 fill-current hover:text-primary-foreground transition-colors duration-300",
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
            <Image
              src="/logo/logo.svg"
              alt="Điện máy ELC"
              width={80}
              height={80}
              className="h-12 w-auto brightness-0 invert"
              style={{ width: "auto" }}
            />
          </Link>
          {settings?.company_short_desc && (
            <p className={styles.logoDesc}>{settings.company_short_desc}</p>
          )}
        </div>

        {/* Navigation Grid */}
        <div className={styles.grid}>
          <NavCol title="Dự án">
            {projects?.length ? (
              projects.slice(0, 8).map((p) => (
                <Link
                  key={p.id}
                  href={
                    p.categories?.slug
                      ? `/du-an/${p.categories.slug}/${p.slug}`
                      : `/du-an/${p.slug}`
                  }
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
            <Link
              href={getSocialUrl("zalo")}
              target="_blank"
              className={styles.link}
            >
              Zalo
            </Link>
            <Link
              href={getSocialUrl("messenger")}
              target="_blank"
              className={styles.link}
            >
              Messenger
            </Link>
            <Link
              href={getSocialUrl("facebook")}
              target="_blank"
              className={styles.link}
            >
              Facebook
            </Link>
            <PhoneConfirmation phone={cleanPhone}>
              <button className={styles.link}>Phone: {phone}</button>
            </PhoneConfirmation>
            <Link
              href={`mailto:${email}`}
              className={cn(styles.link, "truncate")}
            >
              Email: {email}
            </Link>
            <Link
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
              target="_blank"
              className={cn(styles.link, "leading-relaxed")}
            >
              {address}
            </Link>
          </NavCol>
        </div>

        {/* Bottom Section */}
        <div className={styles.bottom}>
          <p className="text-sm font-medium">
            © {currentYear} {settings?.company_name || "ELC"}
          </p>
          <div className={styles.socials}>
            <Link
              href={getSocialUrl("facebook")}
              target="_blank"
              className={styles.icon}
              title="Facebook"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </Link>
            <Link
              href={getSocialUrl("messenger")}
              target="_blank"
              className={styles.icon}
              title="Messenger"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 4.97 0 11.11c0 3.5 1.74 6.62 4.47 8.58.23.17.37.44.37.73v2.39c0 .64.69 1.05 1.25.73l2.67-1.55c.21-.12.45-.18.69-.18.82.11 1.66.18 2.55.18 6.63 0 12-4.97 12-11.11C24 4.97 18.63 0 12 0zm1.25 14.94l-3.21-3.41-6.27 3.41 6.9-7.34 3.21 3.41 6.27-3.41-6.9 7.34z" />
              </svg>
            </Link>
            <Link
              href={getSocialUrl("zalo")}
              target="_blank"
              className="font-bold text-lg hover:text-primary-foreground transition-colors"
              title="Zalo"
            >
              Z
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
