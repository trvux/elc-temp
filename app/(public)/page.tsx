import type { Metadata } from "next";

import { HeroSection } from "@/shared/components/organisms/sections/hero";
import {
  HomeAbout,
  HomeCapabilities,
  HomeContact,
  HomeFaq,
  HomeIntentRouter,
  HomeNews,
  HomeProcess,
  HomeProjects,
} from "@/shared/components/organisms/sections/home-sections";

import { getBrandsAction } from "@/modules/brand/presentation/actions";
import { getNewsAction } from "@/modules/news/presentation/actions";
import { getProjectsAction } from "@/modules/project/presentation/actions";

import { unwrapActionResult } from "@/shared/lib/action-result";
import { HOME_FAQS } from "@/shared/lib/home-content";
import { BASE_URL, SEOSchema, toJsonLdHtml } from "@/shared/lib/seo-schema";

// Brand + contractor positioning only (RFC §2, §5): the homepage owns "Điện máy
// ELC" and "nhà thầu thi công điều hòa & thông gió". Product intents ("máy lạnh",
// "máy lạnh daikin 2hp") stay with /san-pham/*, services with /dich-vu/*.
// Keyword Planner (seo-harness/data/home_ideas.json, 2026-11-21): brand terms are
// below the reporting floor ("điện máy elc" 0, "công ty elc" 40; bare "elc" is
// polluted by a stock ticker), "nhà thầu cơ điện" 4.400 is M&E in general and
// not ELC's scope, "thi công hệ thống thông gió" 210 and "hệ thống hvac là gì" 320
// are the closest real demand, so the title leads with brand + "nhà thầu thi
// công điều hòa & thông gió" and the HVAC definition lives in the FAQ.
const TITLE = "Điện Máy ELC - Nhà Thầu Thi Công Điều Hòa & Thông Gió HVAC";
const DESCRIPTION =
  "Điện máy ELC: nhà thầu EPC khảo sát, thiết kế, cung ứng và thi công điều hòa VRV/VRF, multi, cấp khí tươi thu hồi nhiệt cho biệt thự, văn phòng, nhà hàng tại TP.HCM.";

// Every other page in the app sets its own alternates.canonical — the
// homepage was the one exception (root layout.tsx's metadata has none),
// so it had no canonical tag at all.
// openGraph/twitter replace (not merge with) the layout's objects, so url,
// siteName, locale, type and card are repeated here on purpose.
export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: BASE_URL },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: BASE_URL,
    siteName: "Điện máy ELC",
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

// Hero, then sections that state who ELC is and route each intent to the page
// that owns it. No product grid and no prices: those would repeat /san-pham/* and
// /dich-vu/* under an unrelated H1 (the cannibalization the 2026-10 commits fixed).
export default async function Home() {
  const [brands, projects, news] = await Promise.all([
    getBrandsAction({ limit: 100 }).then(unwrapActionResult),
    getProjectsAction({ isPublished: true, orderBy: "orderIndex", orderDirection: "asc" }).then(unwrapActionResult),
    getNewsAction({ isPublished: true, limit: 3, sortBy: "created_at", sortOrder: "desc" }).then(unwrapActionResult),
  ]);
  const featured = [...projects]
    .sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured))
    .slice(0, 6);

  return (
    <main className="w-full flex flex-col mt-0 mb-0">
      {/* id read by useIsOverHero — the header (and sticky contact pill)
          stay in their "floating over a dark hero" look for exactly this
          region, not a fixed pixel guess. */}
      <div id="hero-chat-region">
        <HeroSection brands={brands || []} />
      </div>
      <HomeAbout projectCount={projects.length} />
      <HomeCapabilities />
      <HomeIntentRouter />
      <HomeProcess />
      <HomeProjects projects={featured} />
      <HomeFaq />
      <HomeNews news={news} />
      <HomeContact />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: toJsonLdHtml({ "@context": "https://schema.org", ...SEOSchema.getFAQPage(HOME_FAQS) }),
        }}
      />
    </main>
  );
}
