import Link from "next/link";

import { getDisplayContacts, type Contact } from "@/modules/contact/domain";
import { ContactLink } from "@/modules/contact/presentation/components/ContactLink";
import { COMPANY_NAME } from "@/shared/lib/company-info";
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

// Page titles are written for the page itself (H1, SEO) and can be long; the
// footer shows a short label for those. Keyed by slug, anything else shows its
// own title.
const FOOTER_LABELS: Record<string, string> = {
  "quy-trinh-thi-cong-lap-dat-may-lanh-chuan-ky-thuat-tai-dien-may-elc": "Quy trình lắp đặt",
};

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
    <div className="flex flex-col gap-5">
      <p id={id} className="type-body-strong text-foreground">
        {title}
      </p>
      <ul aria-labelledby={id} className="flex flex-col gap-3">
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
    <footer className="w-full bg-background">
      <div className="mx-auto w-full max-w-350 min-[112.5rem]:max-w-384 px-4 py-16 md:px-6 md:py-20 lg:px-12">
        <nav
          aria-label="Chân trang"
          className="grid grid-cols-1 gap-x-8 gap-y-10 min-[24rem]:grid-cols-2 md:grid-cols-3 min-[80rem]:grid-cols-5 min-[90rem]:gap-x-6"
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
                  {FOOTER_LABELS[page.slug] ?? page.title}
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
                  {FOOTER_LABELS[page.slug] ?? page.title}
                </Link>
              </li>
            ))}
            <li>
              <CookieSettingsButton className={`${LINK_CLASS} cursor-pointer text-left`} />
            </li>
          </FooterColumn>
        </nav>

        <div className="mt-16 flex flex-col items-center gap-3 text-center">
          <p>
            <small className="type-caption text-foreground">
              © {currentYear} {COMPANY_NAME}
            </small>
          </p>

          {socials.length > 0 && (
            <ul
              aria-label="Liên hệ"
              className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1"
            >
              {socials.map((contact) => (
                <li key={contact.id}>
                  <ContactLink
                    contact={contact}
                    iconClassName="hidden"
                    className="block py-1 type-caption text-muted-foreground transition-colors hover:text-foreground"
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </footer>
  );
}
