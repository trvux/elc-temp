import Image from "next/image";
import Link from "next/link";

import { getDisplayContacts, type Contact } from "@/modules/contact/domain";
import { ContactLink } from "@/modules/contact/presentation/components/ContactLink";
import { COMPANY_NAME, COMPANY_SHORT_DESC } from "@/shared/lib/company-info";
import { CookieSettingsButton } from "./cookie-settings-button";

interface FooterGroup {
  id: string;
  name: string;
  slug: string;
}

interface FooterProjectType {
  id: string;
  name: string;
  slug: string;
}

interface FooterPage {
  id: string;
  title: string;
  slug: string;
}

interface FooterProps {
  groups?: FooterGroup[];
  projectTypes?: FooterProjectType[];
  pages?: FooterPage[];
  contacts?: Contact[];
  currentYear?: number;
}

const SOCIAL_TYPES = ["facebook", "zalo", "messenger", "youtube", "tiktok"];

// /thong-tin pages are admin-managed. Policy pages (chinh-sach-...) are the
// "Pháp lý" column; every other page is "Công ty".
const isLegalPage = (page: FooterPage) => page.slug.startsWith("chinh-sach-");

// py-0.5 + the list gap give each link a ~28px tap target (WCAG 2.5.8 asks for 24px).
const LINK_CLASS =
  "block py-0.5 type-body-sm text-muted-foreground transition-colors hover:text-foreground";

function FooterColumn({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4">
      <p id={id} className="type-label text-foreground">
        {title}
      </p>
      <ul aria-labelledby={id} className="flex flex-col gap-1.5">
        {children}
      </ul>
    </div>
  );
}

// Server Component on purpose: it is repeated on every page, so nothing here
// may ship JS or be serialized into the RSC payload. Column titles are <p>, not
// headings, so they do not sit in every page's outline right after the real
// content; the single <nav> carries the label and each <ul> is named by its
// title through aria-labelledby.
export function Footer({
  groups = [],
  projectTypes = [],
  pages = [],
  contacts = [],
  currentYear = 2026,
}: FooterProps) {
  const socials = getDisplayContacts(contacts, { include: SOCIAL_TYPES });
  const legalPages = pages.filter(isLegalPage);
  const companyPages = pages.filter((page) => !isLegalPage(page));

  return (
    <footer className="relative w-full overflow-hidden bg-background">
      <div className="mx-auto w-full max-w-350 min-[112.5rem]:max-w-384 px-4 pt-16 md:px-6 md:pt-20 lg:px-12">
        <div className="grid grid-cols-1 gap-12 xl:grid-cols-[18rem_minmax(0,1fr)] xl:gap-16">
          <div className="flex max-w-md flex-col gap-6 xl:max-w-none">
            <Link
              href="/"
              aria-label="Điện máy ELC - Trang chủ"
              className="w-fit transition-opacity hover:opacity-80"
            >
              <Image
                src="/logo/logo.svg?v=footer"
                alt="Điện máy ELC"
                width={36}
                height={36}
                loading="lazy"
                style={{ width: "auto" }}
                className="h-9 w-auto md:h-10"
              />
            </Link>
            <p className="type-body text-foreground">{COMPANY_SHORT_DESC}</p>

            {socials.length > 0 && (
              <ul aria-label="Mạng xã hội" className="flex flex-wrap items-center gap-2">
                {socials.map((contact) => (
                  <li key={contact.id}>
                    <ContactLink
                      contact={contact}
                      showLabel={false}
                      showValue={false}
                      iconProps={{ size: 22, weight: "bold" }}
                      className="flex size-10 cursor-pointer items-center justify-center gap-0 rounded-md bg-transparent p-0 text-foreground transition-colors hover:bg-muted"
                      iconClassName="flex items-center justify-center"
                      aria-label={contact.label || contact.type}
                      title={contact.label || contact.type}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>

          <nav
            aria-label="Chân trang"
            className="grid grid-cols-2 gap-x-8 gap-y-10 md:grid-cols-3 lg:grid-cols-5"
          >
            {groups.length > 0 && (
              <FooterColumn id="footer-products" title="Sản phẩm">
                {groups.map((group) => (
                  <li key={group.id}>
                    <Link href={`/san-pham/${group.slug}`} className={LINK_CLASS}>
                      {group.name}
                    </Link>
                  </li>
                ))}
              </FooterColumn>
            )}

            {projectTypes.length > 0 && (
              <FooterColumn id="footer-project-types" title="Loại hình công trình">
                {projectTypes.map((type) => (
                  <li key={type.id}>
                    <Link href={`/du-an/${type.slug}`} className={LINK_CLASS}>
                      {type.name}
                    </Link>
                  </li>
                ))}
              </FooterColumn>
            )}

            <FooterColumn id="footer-resources" title="Tài nguyên">
              <li>
                <Link href="/tin-tuc" className={LINK_CLASS}>
                  Tin tức
                </Link>
              </li>
            </FooterColumn>

            <FooterColumn id="footer-company" title="Công ty">
              {companyPages.map((page) => (
                <li key={page.id}>
                  <Link href={`/${page.slug}`} className={`${LINK_CLASS} line-clamp-2`}>
                    {page.title}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/thong-tin" className={LINK_CLASS}>
                  Liên hệ &amp; chi nhánh
                </Link>
              </li>
            </FooterColumn>

            <FooterColumn id="footer-legal" title="Pháp lý">
              {legalPages.map((page) => (
                <li key={page.id}>
                  <Link href={`/${page.slug}`} className={`${LINK_CLASS} line-clamp-2`}>
                    {page.title}
                  </Link>
                </li>
              ))}
              <li>
                <CookieSettingsButton className={`${LINK_CLASS} cursor-pointer text-left`} />
              </li>
            </FooterColumn>
          </nav>
        </div>

        <p className="mt-16 text-center">
          <small className="type-caption text-foreground">
            © {currentYear} {COMPANY_NAME}
          </small>
        </p>
      </div>

      {/* Decorative brand name, cropped by the footer's overflow-hidden. Hidden
          from assistive tech and crawlers' text: the logo already names the brand. */}
      <div aria-hidden="true" className="pointer-events-none select-none">
        <p className="type-wordmark translate-y-[14%] bg-linear-to-b from-brand to-transparent bg-clip-text text-center text-transparent">
          ELC
        </p>
      </div>
    </footer>
  );
}
