import type { Metadata } from "next";

import { HeroSection } from "@/shared/components/organisms/sections/hero";

import { getBrandsAction } from "@/modules/brand/presentation/actions";

import { unwrapActionResult } from "@/shared/lib/action-result";
import { BASE_URL } from "@/shared/lib/seo-schema";

// Title/description mirror the hero's H1 ("Nhà thầu EPC") and paragraph
// (làm mát, khử ẩm, lọc không khí, trao đổi khí tươi) so the SERP snippet
// matches what the visitor lands on. Overrides the site-wide default in root
// layout.tsx, which stays as the fallback for pages without their own.
// Wording follows what people actually type (GSC 90 days to 2026-11-02, this
// page: "điều hòa không khí", "điều hòa thông gió", "máy lạnh", "khí tươi"),
// not the trade jargon: "MV&AC" and "EPC" had zero search impressions, so
// "MV&AC" stays in the description only and the title leads with the
// searched terms.
const TITLE = "Nhà Thầu EPC Điều Hòa Không Khí & Thông Gió | Điện Máy ELC";
const DESCRIPTION =
  "Nhà thầu EPC chuyên điều hòa không khí (máy lạnh) và thông gió cơ khí (MV&AC): làm mát, khử ẩm, lọc không khí, trao đổi khí tươi. Thiết kế, cung ứng, thi công.";

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

// The homepage is the hero only. Product lists, featured projects and the
// closing CTA used to follow it, repeating the category and project pages'
// headings and links under an unrelated H1 (keyword cannibalization).
export default async function Home() {
  const brands = await getBrandsAction({ limit: 100 }).then(unwrapActionResult);

  return (
    <main className="w-full flex flex-col mt-0 mb-0">
      {/* id read by useIsOverHero — the header (and sticky contact pill)
          stay in their "floating over a dark hero" look for exactly this
          region, not a fixed pixel guess. */}
      <div id="hero-chat-region">
        <HeroSection brands={brands || []} />
      </div>
    </main>
  );
}
