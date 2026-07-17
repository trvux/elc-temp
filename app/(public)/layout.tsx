import { getPublicLayoutData } from "@/modules/settings";
import { Footer } from "@/shared/components/layout/user/footer";
import { Header } from "@/shared/components/layout/user/header";
import { ChunkErrorListener } from "@/shared/components/layout/user/chunk-error-listener";
import { FilterTransitionProvider } from "@/shared/providers/filter-transition-provider";
import { ProductFloatingProvider } from "@/shared/providers/product-floating-provider";
import { TopProgressBar } from "@/shared/components/layout/user/top-progress-bar";
import { StickyContactActions } from "@/shared/components/sections/sticky-contact-actions";
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

  return (
    <ProductFloatingProvider>
    <FilterTransitionProvider>
      {/* GTM: lazy load on first user interaction or after 3.5s timeout */}
      <Script
        id="gtm-script"
        strategy="lazyOnload"
        dangerouslySetInnerHTML={{
          __html: `
            (function(w,d,s,l,i){
              w[l]=w[l]||[];
              var fired = false;
              function loadGTM() {
                if (fired) return;
                fired = true;
                w[l].push({'gtm.start': new Date().getTime(),event:'gtm.js'});
                var f=d.getElementsByTagName(s)[0],
                    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
                j.async=true;
                j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
                f.parentNode.insertBefore(j,f);
              }
              w.addEventListener('scroll', loadGTM, { once: true, passive: true });
              w.addEventListener('mousemove', loadGTM, { once: true, passive: true });
              w.addEventListener('touchstart', loadGTM, { once: true, passive: true });
              w.addEventListener('keydown', loadGTM, { once: true, passive: true });
              setTimeout(loadGTM, 3500);
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
        <Header contacts={contacts} />
        <div className="flex-1 ">{children}</div>
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
      </div>
    </FilterTransitionProvider>
    </ProductFloatingProvider>
  );
}
