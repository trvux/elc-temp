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

  // Find dynamic contact info
  const phone =
    contacts?.find((c) => c.type === "phone")?.value ||
    settings?.company_phone ||
    "0909 411 633";
  const email =
    contacts?.find((c) => c.type === "email")?.value ||
    settings?.company_email ||
    "contact@elc.com";
  const address = settings?.company_address || "06 Phan Chu Trinh St, Q7, HCM";

  const facebookValue =
    contacts?.find((c) => c.type === "facebook")?.value ||
    settings?.facebook_url;
  const messengerValue =
    contacts?.find((c) => c.type === "messenger")?.value ||
    settings?.messenger_url;

  // Helper to ensure social links are absolute
  const formatSocialUrl = (
    url: string | undefined,
    platform: "facebook" | "messenger",
  ) => {
    if (!url || url === "#") return "#";
    if (url.startsWith("http")) return url;
    return platform === "facebook"
      ? `https://www.facebook.com/${url}`
      : `https://m.me/${url}`;
  };

  const facebookUrl = formatSocialUrl(facebookValue, "facebook");
  const messengerUrl = formatSocialUrl(messengerValue, "messenger");

  return (
    <footer className="w-full bg-primary text-primary-foreground/60 py-16 px-4 md:px-6">
      <div className="mx-auto max-w-7xl">
        {/* Logo */}
        <div className="mb-10">
          <Link
            href="/"
            className="inline-block transition-opacity hover:opacity-80"
          >
            <span className="text-xl font-bold tracking-tight text-primary-foreground">
              ELC
            </span>
          </Link>
          {settings?.company_short_desc && (
            <p className="text-sm leading-relaxed max-w-sm mt-4 text-primary-foreground/50">
              {settings.company_short_desc}
            </p>
          )}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-10 gap-x-8">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-primary-foreground">
              Công trình
            </h3>
            <nav className="flex flex-col gap-3">
              {projects && projects.length > 0 ? (
                projects.slice(0, 8).map((item) => {
                  const projectUrl = item.categories?.slug
                    ? `/cong-trinh/${item.categories.slug}/${item.slug}`
                    : `/cong-trinh/${item.slug}`;
                  return (
                    <Link
                      key={item.id}
                      href={projectUrl}
                      className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors"
                    >
                      {item.title}
                    </Link>
                  );
                })
              ) : (
                <span className="text-xs italic text-primary-foreground/30">
                  Đang cập nhật
                </span>
              )}
            </nav>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-primary-foreground">
              Chi nhánh
            </h4>
            <nav className="flex flex-col gap-3">
              {branches && branches.length > 0 ? (
                branches.map((item) => (
                  <Link
                    key={item.slug}
                    href={`/chi-nhanh/${item.slug}`}
                    className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors"
                  >
                    {item.name}
                  </Link>
                ))
              ) : (
                <span className="text-xs italic text-primary-foreground/30">
                  Đang cập nhật
                </span>
              )}
            </nav>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-primary-foreground">
              Thông tin
            </h4>
            <nav className="flex flex-col gap-3">
              {pages && pages.length > 0 ? (
                pages.slice(0, 8).map((item) => (
                  <Link
                    key={item.slug}
                    href={`/thong-tin?slug=${item.slug}`}
                    className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors"
                  >
                    {item.title}
                  </Link>
                ))
              ) : (
                <span className="text-xs italic text-primary-foreground/30">
                  Đang cập nhật
                </span>
              )}
            </nav>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-primary-foreground">
              Liên hệ
            </h4>
            <nav className="flex flex-col gap-3">
              <PhoneConfirmation phone={phone.replace(/\s/g, "")}>
                <button className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors text-left">
                  {phone}
                </button>
              </PhoneConfirmation>
              <Link
                href={`mailto:${email}`}
                className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors truncate"
              >
                {email}
              </Link>
              <Link
                href={`https://zalo.me/${phone.replace(/\s/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors"
              >
                Zalo
              </Link>
              <Link
                href={messengerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors"
              >
                Messenger
              </Link>
              <Link
                href={facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors"
              >
                Facebook
              </Link>
              <Link
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors leading-relaxed"
              >
                {address}
              </Link>
            </nav>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-16 pt-8 border-t border-primary-foreground/10 flex flex-col gap-4">
          <p className="text-sm text-primary-foreground">
            © {currentYear} {settings?.company_name || "ELC"}
          </p>
          <div className="flex items-center gap-5 text-primary-foreground/60">
            <Link
              href={facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary-foreground transition-colors"
              title="Facebook"
            >
              <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </Link>
            <Link
              href={messengerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary-foreground transition-colors"
              title="Messenger"
            >
              <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 4.97 0 11.11c0 3.5 1.74 6.62 4.47 8.58.23.17.37.44.37.73v2.39c0 .64.69 1.05 1.25.73l2.67-1.55c.21-.12.45-.18.69-.18.82.11 1.66.18 2.55.18 6.63 0 12-4.97 12-11.11C24 4.97 18.63 0 12 0zm1.25 14.94l-3.21-3.41-6.27 3.41 6.9-7.34 3.21 3.41 6.27-3.41-6.9 7.34z" />
              </svg>
            </Link>
            <Link
              href={`https://zalo.me/${phone.replace(/\s/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary-foreground transition-colors"
              title="Zalo"
            >
              <span className="font-bold text-lg leading-none">Z</span>
            </Link>
            <Link
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary-foreground transition-colors"
              title="Địa chỉ"
            >
              <svg className="h-5 w-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
