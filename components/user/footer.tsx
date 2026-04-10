"use client";

import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGlobe,
  faLocationDot,
  faBuilding,
  faZ,
} from "@fortawesome/free-solid-svg-icons";
import {
  faFacebook,
  faFacebookMessenger,
} from "@fortawesome/free-brands-svg-icons";
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
    // If user only entered a username/slug
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
            <h4 className="text-sm font-semibold text-primary-foreground">
              Công trình
            </h4>
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
            <h4 className="text-sm font-semibold text-primary-foreground">
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
            <h4 className="text-sm font-semibold text-primary-foreground">
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
            <h4 className="text-sm font-semibold text-primary-foreground">
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
          <div className="flex items-center gap-4 text-primary-foreground/60">
            <Link
              href={facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary-foreground transition-colors"
            >
              <FontAwesomeIcon icon={faFacebook} className="h-4 w-4" />
            </Link>
            <Link
              href={messengerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary-foreground transition-colors"
            >
              <FontAwesomeIcon icon={faFacebookMessenger} className="h-4 w-4" />
            </Link>
            <Link
              href={`https://zalo.me/${phone.replace(/\s/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary-foreground transition-colors"
            >
              <FontAwesomeIcon icon={faZ} className="h-4 w-4" />
            </Link>
            <Link
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary-foreground transition-colors"
            >
              <FontAwesomeIcon icon={faLocationDot} className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
