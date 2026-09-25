import { getPublicLayoutData } from "@/modules/settings";
import { Footer } from "@/shared/components/organisms/layout/user/footer";
import { Header } from "@/shared/components/organisms/layout/user/header";
import { ChunkErrorListener } from "@/shared/components/organisms/layout/user/chunk-error-listener";
import { FilterTransitionProvider } from "@/shared/providers/filter-transition-provider";
import { ProductFloatingProvider } from "@/shared/providers/product-floating-provider";
import { WishlistProvider } from "@/shared/providers/wishlist-provider";
import { CompareProvider } from "@/shared/providers/compare-provider";
import { ContactProvider } from "@/shared/providers/contact-provider";
import { CompareTray } from "@/shared/components/organisms/layout/user/compare-tray";
import { WishlistDialog } from "@/shared/components/organisms/layout/user/wishlist-dialog";
import { TopProgressBar } from "@/shared/components/organisms/layout/user/top-progress-bar";
import { StickyContactActions } from "@/shared/components/organisms/sections/sticky-contact-actions";
import { SEOSchema, toJsonLdHtml } from "@/shared/lib/seo-schema";
import { ConsentBanner } from "@/shared/components/organisms/layout/user/consent-banner";
import { DEFAULT_CONSENT, toGtagConsentPayload } from "@/shared/lib/consent";
import { getStoredConsent } from "@/shared/lib/consent-server";
import Script from "next/script";

// No caching anywhere in this tree anymore (see cacheComponents removal in
// next.config.ts) — every public page fetches live from the Go API on each
// request, so the whole (public) segment must render dynamically rather
// than attempt a static/prerendered shell.
export const dynamic = "force-dynamic";

interface PublicLayoutProps {
  children: React.ReactNode;
}

export default async function PublicLayout({ children }: PublicLayoutProps) {
  const {
    settings,
    contacts,
    branches,
    projects,
    pages,
    categories,
    brands,
    groupCategories,
    categoriesList,
    projectTypes,
    currentYear,
  } = await getPublicLayoutData();

  // Đọc lựa chọn cookie đã lưu (nếu có) để set đúng default ngay từ đầu —
  // tránh trường hợp khách đã đồng ý trước đó vẫn bị coi là "denied" cho
  // tới lúc banner client mount xong mới update lại.
  const storedConsent = await getStoredConsent();
  const initialConsentPayload = toGtagConsentPayload(storedConsent ?? DEFAULT_CONSENT);

  return (
    <ContactProvider contacts={contacts || []}>
    <WishlistProvider>
    <CompareProvider>
    <ProductFloatingProvider>
    <FilterTransitionProvider>
      {/* Organization + WebSite — the only two site-wide JSON-LD entities,
          scoped to the public tree since only public pages need them. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: toJsonLdHtml({
            "@context": "https://schema.org",
            "@graph": [SEOSchema.getOrganization(branches, contacts), SEOSchema.getWebSite()],
          }),
        }}
      />

      {/* GTM: loads right after the page is interactive (non-blocking, async
          fetch) instead of waiting for a scroll/mousemove/touch/keydown or a
          3.5s timeout — the old interaction-gated version silently dropped
          every visit that left before any of those fired (e.g. a fast ad-click
          bounce), so GA4/Google Ads conversion tags never saw those sessions
          at all.

          Consent Mode v2 default is set in THIS SAME script, before the GTM
          loader IIFE runs — required so gtm.js sees the consent state before
          any tag fires (see shared/lib/consent.ts). Two separate <Script>
          tags would not guarantee this ordering; one inline block does. */}
      <Script
        id="gtm-script"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            window.gtag = window.gtag || function(){ window.dataLayer.push(arguments); };
            window.gtag('consent', 'default', ${JSON.stringify(initialConsentPayload)});

            (function(w,d,s,l,i){
              w[l]=w[l]||[];
              w[l].push({'gtm.start': new Date().getTime(),event:'gtm.js'});
              var f=d.getElementsByTagName(s)[0],
                  j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
              j.async=true;
              j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
              f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-TQ9DL8CG');
          `,
        }}
      />
      <noscript>
        <iframe
          src="https://www.googletagmanager.com/ns.html?id=GTM-TQ9DL8CG"
          height="0"
          width="0"
          style={{ display: "none", visibility: "hidden" }}
        />
      </noscript>
      <TopProgressBar />
      <div className="flex flex-col min-h-screen">
        <ChunkErrorListener />
        <Header
          contacts={contacts}
          groupCategories={groupCategories}
          categoriesList={categoriesList}
          brands={brands}
        />
        {/* pt clears the fixed header (h-16); pages with a full-bleed hero
            cancel it with -mt-16 on their own root section so the header
            can sit transparently over them. */}
        <div className="flex-1 pt-16">{children}</div>
        <Footer
          branches={branches}
          projects={projects}
          pages={pages}
          settings={settings}
          contacts={contacts}
          categories={categories}
          brands={brands}
          groupCategories={groupCategories}
          categoriesList={categoriesList}
          projectTypes={projectTypes}
          currentYear={currentYear}
        />
        <StickyContactActions contacts={contacts || []} />
        <CompareTray />
        <WishlistDialog />
      </div>
      <ConsentBanner initialConsent={storedConsent} />
    </FilterTransitionProvider>
    </ProductFloatingProvider>
    </CompareProvider>
    </WishlistProvider>
    </ContactProvider>
  );
}
