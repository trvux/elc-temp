import type { Metadata } from "next";

import { HeroSection } from "@/shared/components/organisms/sections/hero";

import { getBrandsAction } from "@/modules/brand/presentation/actions";

import { unwrapActionResult } from "@/shared/lib/action-result";
import { BASE_URL } from "@/shared/lib/seo-schema";

// Every other page in the app sets its own alternates.canonical — the
// homepage was the one exception (root layout.tsx's metadata has none),
// so it had no canonical tag at all.
export const metadata: Metadata = {
  alternates: { canonical: BASE_URL },
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
