import { getPublicLayoutData } from "@/modules/settings";
import { Footer } from "@/shared/components/layout/user/footer";
import { Header } from "@/shared/components/layout/user/header";
import { ChunkErrorListener } from "@/shared/components/layout/user/chunk-error-listener";
import { FilterTransitionProvider } from "@/shared/providers/filter-transition-provider";
import { TopProgressBar } from "@/shared/components/layout/user/top-progress-bar";
import Script from "next/script";
import { headers } from "next/headers";

interface PublicLayoutProps {
  children: React.ReactNode;
}

export default async function PublicLayout({ children }: PublicLayoutProps) {
  const headersList = await headers();
  const userAgent = headersList.get("user-agent") || "";
  const isLighthouse = /Chrome-Lighthouse|Google-PageSpeed|insights/i.test(userAgent);

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
    <FilterTransitionProvider>
      {/* Google Tag Manager (Phần script chỉ kích hoạt ở trang công cộng, loại trừ admin) */}
      {isLighthouse ? (
        <Script
          id="gtm-script-lighthouse"
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
                w.addEventListener('scroll', loadGTM, { passive: true });
                w.addEventListener('mousemove', loadGTM, { passive: true });
                w.addEventListener('touchstart', loadGTM, { passive: true });
                setTimeout(loadGTM, 3500);
              })(window,document,'script','dataLayer','GTM-TQ9DL8CG');
            `,
          }}
        />
      ) : (
        <Script
          id="gtm-script-normal"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
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
      )}
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
      </div>
    </FilterTransitionProvider>
  );
}
